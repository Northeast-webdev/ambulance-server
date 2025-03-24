// controllers/carController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { Run } = require("../schema/run.schema");
const createCar = async (request, reply) => {
  const { meta, name, image, old_car_id } = request.body;
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

    // TODO: Add a function to add new car ,set old car to status "scrapped", replace pending runs car attribute with new car id
    if (old_car_id) {
      await Car.updateOne(
        { _id: old_car_id },
        { $set: { status: "scrapped", user: null } }
      );
      await User.updateOne({ car: old_car_id }, { $set: { car: null } });
      await Run.updateMany(
        { car: old_car_id, status: "pending" },
        { $set: { car: car._id } }
      );
    }
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
  if (shift_start !== undefined) updates.shift_start = shift_start;
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
      const existingUser = await User.findOne({ _id: user });
      if (existingUser) {
        const query = { _id: existingUser._id };
        const update = { car: result._id };
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
