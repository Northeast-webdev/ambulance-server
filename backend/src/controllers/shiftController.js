const Shift = require("../schema/shift.schema");
const User = require("../schema/user.schema");
const Car = require("../schema/car.schema");

async function createShift(fastify, request, reply) {
  try {
    const { vehicle, date, shift_start, shift_end, crew, notes } = request.body;

    // Validate vehicle exists
    const vehicleExists = await Car.findById(vehicle);
    if (!vehicleExists) {
      return reply.status(404).send({ error: "Vehicle not found" });
    }

    // Validate crew members exist and have correct roles
    for (const [role, member] of Object.entries(crew)) {
      if (member.user) {
        const user = await User.findById(member.user);
        if (!user) {
          return reply.status(404).send({ error: `${role} user not found` });
        }
        if (!user.roles.includes(role)) {
          return reply.status(400).send({ error: `User is not a ${role}` });
        }
      }
    }

    const shift = new Shift({
      vehicle,
      date,
      shift_start,
      shift_end,
      crew,
      notes,
    });

    await shift.save();
    return reply.status(201).send(shift);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

async function listShifts(fastify, request, reply) {
  try {
    const { start_date, end_date, vehicle, status } = request.query;
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
      .populate("crew.nurse.user");

    return reply.send(shifts);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

async function getShift(fastify, request, reply) {
  try {
    const shift = await Shift.findById(request.params.id)
      .populate("vehicle")
      .populate("crew.driver.user")
      .populate("crew.doctor.user")
      .populate("crew.nurse.user");

    if (!shift) {
      return reply.status(404).send({ error: "Shift not found" });
    }

    return reply.send(shift);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

async function updateShift(fastify, request, reply) {
  try {
    const { vehicle, date, shift_start, shift_end, crew, status, notes } =
      request.body;

    const shift = await Shift.findById(request.params.id);
    if (!shift) {
      return reply.status(404).send({ error: "Shift not found" });
    }

    // Validate vehicle if being updated
    if (vehicle) {
      const vehicleExists = await Car.findById(vehicle);
      if (!vehicleExists) {
        return reply.status(404).send({ error: "Vehicle not found" });
      }
      shift.vehicle = vehicle;
    }

    // Validate crew members if being updated
    if (crew) {
      for (const [role, member] of Object.entries(crew)) {
        if (member.user) {
          const user = await User.findById(member.user);
          if (!user) {
            return reply.status(404).send({ error: `${role} user not found` });
          }
          if (!user.roles.includes(role)) {
            return reply.status(400).send({ error: `User is not a ${role}` });
          }
        }
      }
      shift.crew = crew;
    }

    if (date) shift.date = date;
    if (shift_start) shift.shift_start = shift_start;
    if (shift_end) shift.shift_end = shift_end;
    if (status) shift.status = status;
    if (notes) shift.notes = notes;

    await shift.save();
    return reply.send(shift);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

async function deleteShift(fastify, request, reply) {
  try {
    const shift = await Shift.findByIdAndDelete(request.params.id);
    if (!shift) {
      return reply.status(404).send({ error: "Shift not found" });
    }
    return reply.send({ message: "Shift deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

module.exports = function (fastify, opts, done) {
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

  done();
};
