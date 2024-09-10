// controllers/carController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");

const createCar = async (request, reply) => {
  const { meta, user, status } = request.body;
  const car = new Car({ meta, user, status });
  try {
    await car.save();
    reply.send(car);
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const listCars = async (request, reply) => {
  const { page = 1, limit = 10 } = request.query;
  try {
    const cars = await Car.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
      .select("meta status user created_at updated_at")
      .exec();
    return { cars, page, limit };
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const getCar = async (request, reply) => {
  try {
    const car = await Car.findOne({
      _id: request.params.id,
    }).exec();
    return car;
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const updateCar = async (request, reply) => {
  const { meta, status, user } = request.body;
  const updates = {};

  // if some fields are missing, do not update them
  if (meta) updates.meta = meta;
  if (status) updates.status = status;
  if (user) updates.user = user;

  updates.updated_at = new Date().toISOString();

  try {
    const result = await Car.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      {
        returnDocument: "after",
      }
    );
    reply.send(result.value);
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
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const carRoutes = () => {
  fastify.post("/cars", { preHandler: [fastify.authenticate] }, createCar);
  fastify.get("/cars", { preHandler: [fastify.authenticate] }, listCars);
  fastify.get("/cars/:id", { preHandler: [fastify.authenticate] }, getCar);
  fastify.put("/cars/:id", { preHandler: [fastify.authenticate] }, updateCar);
  fastify.delete(
    "/cars/:id",
    { preHandler: [fastify.authenticate] },
    deleteCar
  );
};

module.exports = carRoutes;
