// controllers/carController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { Alarm } = require("../schema/alarm.schema");

const zoneCenter = { lat: 44.42600757181744, lng: 8.850815866176998 }; // Example coordinates
const radiusInKm = 0.12;

function isUserInZone(last_location) {
  const distance = calculateDistance(
    zoneCenter.lat,
    zoneCenter.lng,
    last_location.latitude,
    last_location.longitude
  );

  return distance <= radiusInKm;
}

const createCar = async (request, reply) => {
  const { meta, name, image } = request.body;
  const car = new Car({
    meta,
    name,
    damages: {
      // Initialize damages with default values
      front: [],
      back: [],
      left: [],
      right: [],
    },
    image,
  });
  try {
    await car.save();
    reply.send(car);
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const listCars = async (request, reply) => {
  const { page = 1, limit = 20 } = request.query;
  try {
    const cars = await Car.find()
      .populate("user", "first_name last_name _id")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 })
      .exec();
    return { cars, page, limit };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getCar = async (request, reply) => {
  try {
    const car = await Car.findOne({
      _id: request.params.id,
    }).exec();
    return car;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateCar = async (request, reply) => {
  const {
    meta,
    status,
    user,
    last_location,
    shift_start,
    name,
    damages,
    image,
  } = request.body;
  const updates = {};
  const carWithUser = await Car.findOne({ user });

  if (user && user !== null && carWithUser) {
    return reply
      .code(400)
      .send({ error: "This user has already been assigned" });
  }

  // if some fields are missing, do not update them
  if (meta) updates.meta = meta;
  if (status) updates.status = status;
  if (user !== undefined) updates.user = user;
  if (last_location) updates.last_location = last_location;
  if (shift_start) updates.shift_start = shift_start;
  if (name) updates.name = name;
  if (damages) updates.damages = damages; // Update damages if provided
  if (image) updates.image = image;
  updates.updated_at = new Date().toISOString();

  try {
    const result = await Car.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      {
        returnDocument: "after",
      }
    );
    if (!carWithUser && user) {
      const existingUser = await User.findOne({ _id: user }).populate("alarms");
      if (existingUser) {
        const query = { _id: existingUser._id };
        const update = { car: result._id };
        if (last_location) {
          const isInZone = isUserInZone(last_location);

          const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
          const recentAlarm = await Alarm.findOne({
            user: existingUser._id,
            car: result._id,
            created_at: { $gte: oneHourAgo }, // Find alarms within the last 1 hour
          });
          if (!isInZone && !recentAlarm) {
            const car_checklist_done = await CarChecklist.exists({
              car: result._id,
              user: existingUser._id,
              created_at: { $gte: oneHourAgo },
            });
            const material_checklist_done = await MaterialChecklist.exists({
              car: result._id,
              user: existingUser._id,
              created_at: { $gte: oneHourAgo },
            });
            const alarm = new Alarm({
              user: existingUser._id,
              car: result._id,
              car_checklist_done: !!car_checklist_done,
              material_checklist_done: !!material_checklist_done,
            });
            await alarm.save();
            update.alarms = [...existingUser.alarms, alarm._id];
          }
        }
        await User.updateOne(query, update);
      }
    }
    reply.send(result);
  } catch (error) {
    reply.code(500).send(error);
  }
};

const deleteCar = async (request, reply) => {
  try {
    const result = await Car.deleteOne({
      _id: request.params.id,
    });
    if (result.deletedCount === 0) {
      return reply.code(404).send({ error: "Car not found" });
    }
    reply.send({ message: "Car deleted successfully" });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getChecklistsForCar = async (request, reply) => {
  try {
    const car_checklists = await CarChecklist.find({
      car: request.params.id,
    })
      .populate("user", "first_name last_name _id")
      .exec();
    const material_checklists = await MaterialChecklist.find({
      car: request.params.id,
    })
      .populate("user", "first_name last_name _id")
      .exec();
    return { car_checklists, material_checklists };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const websocketHandler = (socket) => {
  console.log("Client connected");

  // Create change stream to listen for changes in the collection
  const changeStream = Car.watch();

  changeStream.on("change", (change) => {
    // Broadcast the change event to the connected WebSocket client
    socket.send(JSON.stringify(change));
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    // Clean up change stream on disconnect
    changeStream.close();
  });
};

const carRoutes = () => {
  fastify.post("/api/cars", { preHandler: [fastify.authenticate] }, createCar);
  fastify.get("/api/cars", { preHandler: [fastify.authenticate] }, listCars);
  fastify.get("/api/cars/:id", { preHandler: [fastify.authenticate] }, getCar);
  fastify.put(
    "/api/cars/:id",
    { preHandler: [fastify.authenticate] },
    updateCar
  );
  fastify.delete(
    "/api/cars/:id",
    { preHandler: [fastify.authenticate] },
    deleteCar
  );
  fastify.get(
    "/api/cars/:id/checklists",
    { preHandler: [fastify.authenticate] },
    getChecklistsForCar
  );

  fastify.register(async (fastify) => {
    fastify.get("/api/cars/ws", { websocket: true }, (socket) => {
      websocketHandler(socket);
    });
  });
};

module.exports = carRoutes;
