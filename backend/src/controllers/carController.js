// controllers/carController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");

const createCar = async (request, reply) => {
  const { meta, user, status } = request.body;
  const car = new Car({ meta, user, status });
  const userExists = await User.findOne({ _id: user });
  const carWithUser = await Car.findOne({ user });
  if (carWithUser) {
    return reply.code(400).send({ error: "User already has a car" });
  }
  if (!userExists) {
    return reply.code(404).send({ error: "User not found" });
  }
  try {
    await car.save();
    await User.updateOne({ _id: user }, { car: car._id });
    reply.send(car);
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const listCars = async (request, reply) => {
  const { page = 1, limit = 10 } = request.query;
  try {
    const cars = await Car.find()
      .populate("user", "first_name last_name _id")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
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
  const { meta, status, user } = request.body;
  const updates = {};
  const carWithUser = await Car.findOne({ user });
  if (user !== null && carWithUser) {
    return reply
      .code(400)
      .send({ error: "This user has already been assigned" });
  }
  // if some fields are missing, do not update them
  if (meta) updates.meta = meta;
  if (status) updates.status = status;
  if (user !== undefined) updates.user = user;

  updates.updated_at = new Date().toISOString();

  try {
    const result = await Car.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      {
        returnDocument: "after",
      }
    );
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
};

module.exports = carRoutes;
