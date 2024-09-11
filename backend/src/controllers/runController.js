// controllers/runController.js

const { fastify } = require("../init");
const { Run } = require("../schema/run.schema");
require("dotenv").config();

const createRun = async (request, reply) => {
  const { car, title, meta } = request.body;
  const run = new Run({ car, title, meta });
  try {
    await run.save();
    reply.send({ run: run });
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const listRuns = async (request, reply) => {
  const { page = 1, limit = 10 } = request.query;
  try {
    const runs = await Run.find()
      .populate("car")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
      .exec();
    return { runs, page, limit };
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const getRun = async (request, reply) => {
  try {
    const run = await Run.findOne({
      _id: request.params.id,
    })
      .populate("car")
      .exec();
    return run;
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const updateRun = async (request, reply) => {
  const { car, title, meta, status } = request.body;
  const updates = {};

  // if some fields are missing, do not update them
  if (car) updates.car = car;
  if (title) updates.title = title;
  if (meta) updates.meta = meta;
  if (status) updates.status = status;

  updates.updated_at = new Date().toISOString();

  try {
    const result = await Run.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      {
        returnDocument: "after",
      }
    ).exec();
    reply.send(result);
  } catch (error) {
    reply.code(500).send(error);
  }
};

const deleteRun = async (request, reply) => {
  try {
    const result = await Run.deleteOne({
      _id: request.params.id,
    });
    if (result.deletedCount === 0) {
      return reply.code(404).send({ error: "Run not found" });
    }
    reply.send({ message: "Run deleted successfully" });
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const runRoutes = () => {
  fastify.post("/runs", { preHandler: [fastify.authenticate] }, createRun);
  fastify.get("/runs", { preHandler: [fastify.authenticate] }, listRuns);
  fastify.get("/runs/:id", { preHandler: [fastify.authenticate] }, getRun);
  fastify.put("/runs/:id", { preHandler: [fastify.authenticate] }, updateRun);
  fastify.delete(
    "/runs/:id",
    { preHandler: [fastify.authenticate] },
    deleteRun
  );
};

module.exports = runRoutes;
