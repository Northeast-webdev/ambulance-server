const { fastify } = require("../init");
const { Shift } = require("../schema/shift.schema");
const { User } = require("../schema/user.schema");
const { Car } = require("../schema/car.schema");

const createShift = async (request, reply) => {
  try {
    const { vehicle, date, shift_start, shift_end, crew, notes, status } =
      request.body;

    // Validate vehicle exists
    const vehicleExists = await Car.findById(vehicle);
    if (!vehicleExists) {
      return reply.code(404).send({ error: "Vehicle not found" });
    }

    // Validate crew members exist
    for (const [role, member] of Object.entries(crew)) {
      if (member.user) {
        const user = await User.findById(member.user);
        if (!user) {
          return reply.code(404).send({ error: `${role} user not found` });
        }
        // No role validation - any user can be assigned to any role
      }
    }

    const shift = new Shift({
      vehicle,
      date: new Date(date),
      shift_start,
      shift_end,
      crew,
      notes,
      status: status || "scheduled",
    });

    await shift.save();

    const populatedShift = await Shift.findById(shift._id)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user");

    return reply.code(201).send(populatedShift);
  } catch (error) {
    console.error("Error creating shift:", error);
    return reply.code(500).send({ error: "Error creating shift" });
  }
};

const listShifts = async (request, reply) => {
  try {
    const {
      start_date,
      end_date,
      vehicle,
      status,
      page = 1,
      limit = 50,
    } = request.query;
    const query = {};

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    if (vehicle) {
      query.vehicle = vehicle;
    }

    if (status) {
      query.status = status;
    }

    const shifts = await Shift.find(query)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const total = await Shift.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return reply.send(shifts);
  } catch (error) {
    console.error("Error listing shifts:", error);
    return reply.code(500).send({ error: "Error retrieving shifts" });
  }
};

const getShift = async (request, reply) => {
  try {
    const shift = await Shift.findById(request.params.id)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user");

    if (!shift) {
      return reply.code(404).send({ error: "Shift not found" });
    }

    return reply.send(shift);
  } catch (error) {
    console.error("Error getting shift:", error);
    return reply.code(500).send({ error: "Error retrieving shift" });
  }
};

const updateShift = async (request, reply) => {
  try {
    const { vehicle, date, shift_start, shift_end, crew, status, notes } =
      request.body;

    const shift = await Shift.findById(request.params.id);
    if (!shift) {
      return reply.code(404).send({ error: "Shift not found" });
    }

    // Validate vehicle if being updated
    if (vehicle) {
      const vehicleExists = await Car.findById(vehicle);
      if (!vehicleExists) {
        return reply.code(404).send({ error: "Vehicle not found" });
      }
      shift.vehicle = vehicle;
    }

    // Validate crew members if being updated
    if (crew) {
      for (const [role, member] of Object.entries(crew)) {
        if (member.user) {
          const user = await User.findById(member.user);
          if (!user) {
            return reply.code(404).send({ error: `${role} user not found` });
          }
          // No role validation - any user can be assigned to any role
        }
      }
      shift.crew = crew;
    }

    if (date) shift.date = new Date(date);
    if (shift_start) shift.shift_start = shift_start;
    if (shift_end) shift.shift_end = shift_end;
    if (status) shift.status = status;
    if (notes !== undefined) shift.notes = notes;

    await shift.save();

    const updatedShift = await Shift.findById(shift._id)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user");

    return reply.send(updatedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return reply.code(500).send({ error: "Error updating shift" });
  }
};

const deleteShift = async (request, reply) => {
  try {
    const shift = await Shift.findByIdAndDelete(request.params.id);
    if (!shift) {
      return reply.code(404).send({ error: "Shift not found" });
    }
    return reply.send({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return reply.code(500).send({ error: "Error deleting shift" });
  }
};

const getUserShifts = async (request, reply) => {
  try {
    const userId = request.user._id;

    // Find shifts where this user is part of the crew
    const shifts = await Shift.find({
      "crew.user": userId,
    })
      .populate("vehicle")
      .populate("crew.user", "first_name last_name role")
      .sort({ startTime: 1 })
      .exec();

    return { shifts };
  } catch (err) {
    console.error("Error getting user shifts:", err);
    reply.code(500).send({ error: "Failed to fetch shifts" });
  }
};

const shiftRoutes = () => {
  fastify.post(
    "/api/shifts",
    { preHandler: [fastify.authenticate] },
    createShift
  );
  fastify.get(
    "/api/shifts",
    { preHandler: [fastify.authenticate] },
    listShifts
  );
  fastify.get(
    "/api/shifts/:id",
    { preHandler: [fastify.authenticate] },
    getShift
  );
  fastify.put(
    "/api/shifts/:id",
    { preHandler: [fastify.authenticate] },
    updateShift
  );
  fastify.delete(
    "/api/shifts/:id",
    { preHandler: [fastify.authenticate] },
    deleteShift
  );

  // Get shifts for the logged-in user
  fastify.get(
    "/api/shifts/user",
    { preHandler: [fastify.authenticate] },
    getUserShifts
  );
};

module.exports = shiftRoutes;
