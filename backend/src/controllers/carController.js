// controllers/carController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");

const createCar = async (request, reply) => {
  const { meta, name } = request.body;
  const car = new Car({ meta, name });
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
  const { meta, status, user, last_location, shift_start, name } = request.body;
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
        await User.updateOne({ _id: existingUser._id }, { car: result._id });
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
