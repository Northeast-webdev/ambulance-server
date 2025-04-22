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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find shifts where the user is in any crew role
    const shifts = await Shift.find({
      $or: [
        { "crew.driver.user": userId },
        { "crew.doctor.user": userId },
        { "crew.nurse.user": userId },
      ],
    })
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user")
      .sort({ date: 1, shift_start: 1 });

    // Transform shifts to match app's expected format
    const transformedShifts = shifts.map((shift) => {
      // Create date objects with exact hours and minutes as stored
      const startDate = new Date(shift.date);
      const [startHours, startMinutes] = shift.shift_start
        .split(":")
        .map(Number);
      startDate.setHours(startHours, startMinutes, 0, 0);

      const endDate = new Date(shift.date);
      const [endHours, endMinutes] = shift.shift_end.split(":").map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);

      // Determine if this is the current shift
      const isCurrentShift =
        shift.status === "scheduled" && startDate <= now && endDate > now;

      // If this is the current shift and it's not already in progress, update it
      if (isCurrentShift && shift.status === "scheduled") {
        shift.status = "in_progress";
        shift.save();
      }

      // Create array of crew members
      const crewMembers = [];
      if (shift.crew.driver?.user) {
        crewMembers.push({
          role: "driver",
          user: shift.crew.driver.user,
          startTime: shift.crew.driver.start_time,
          endTime: shift.crew.driver.end_time,
        });
      }
      if (shift.crew.doctor?.user) {
        crewMembers.push({
          role: "doctor",
          user: shift.crew.doctor.user,
          startTime: shift.crew.doctor.start_time,
          endTime: shift.crew.doctor.end_time,
        });
      }
      if (shift.crew.nurse?.user) {
        crewMembers.push({
          role: "nurse",
          user: shift.crew.nurse.user,
          startTime: shift.crew.nurse.start_time,
          endTime: shift.crew.nurse.end_time,
        });
      }

      return {
        _id: shift._id,
        date: shift.date,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        vehicle: shift.vehicle,
        crew: crewMembers,
        notes: shift.notes,
        status: shift.status,
      };
    });

    return reply.send(transformedShifts);
  } catch (error) {
    console.error("Error fetching user shifts:", error);
    return reply.code(500).send({ message: "Error fetching shifts" });
  }
};

const completeShift = async (request, reply) => {
  try {
    const userId = request.user._id;
    const shiftId = request.params.id;

    const shift = await Shift.findOne({
      _id: shiftId,
      $or: [
        { "crew.driver.user": userId },
        { "crew.doctor.user": userId },
        { "crew.nurse.user": userId },
      ],
      status: "in_progress",
    });

    if (!shift) {
      return reply
        .status(404)
        .json({ message: "Shift not found or not in progress" });
    }

    shift.status = "completed";
    await shift.save();

    return reply.json({ message: "Shift completed successfully" });
  } catch (error) {
    console.error("Error completing shift:", error);
    return reply.status(500).json({ message: "Error completing shift" });
  }
};

const scheduleShiftNotifications = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find shifts starting in the next hour
    const upcomingShifts = await Shift.find({
      status: "scheduled",
      date: { $lte: oneHourFromNow },
      shift_start: {
        $gte: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        $lte: oneHourFromNow.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    }).populate("crew.driver.user crew.doctor.user crew.nurse.user");

    for (const shift of upcomingShifts) {
      const crewMembers = [
        shift.crew.driver?.user,
        shift.crew.doctor?.user,
        shift.crew.nurse?.user,
      ].filter(Boolean);

      for (const member of crewMembers) {
        if (member.pushToken) {
          // Send push notification
          await sendPushNotification({
            to: member.pushToken,
            title: "Shift Starting Soon",
            body: `Your shift starts in 1 hour at ${shift.shift_start}`,
            data: { shiftId: shift._id },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error scheduling shift notifications:", error);
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
    "/api/shifts/user/:id",
    { preHandler: [fastify.authenticate] },
    getUserShifts
  );

  // Complete a shift for the current user
  fastify.post(
    "/api/shifts/complete/:id",
    { preHandler: [fastify.authenticate] },
    completeShift
  );
};

module.exports = shiftRoutes;
