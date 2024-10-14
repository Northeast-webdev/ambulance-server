// controllers/materialChecklistController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { User } = require("../schema/user.schema");
const { printMaterialChecklist } = require("./pdfController");

const createMaterialChecklist = async (request, reply) => {
  const { checklist, user, car } = request.body;
  const materialChecklist = new MaterialChecklist({ user, car });
  const userExists = await User.findOne({ _id: user });
  const carExists = await Car.findOne({ _id: car });
  try {
    await materialChecklist.save();
    if (userExists) {
      await User.updateOne(
        { _id: user },
        { $push: { material_checklists: materialChecklist._id } }
      );
    }
    if (carExists) {
      await Car.updateOne(
        { _id: car },
        { $push: { material_checklists: materialChecklist._id } }
      );
    }

    // print the pdf here
    printMaterialChecklist({
      id: materialChecklist._id,
      checklist,
    });
    reply.send(materialChecklist);
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const listMaterialChecklists = async (request, reply) => {
  const { page = 1, limit = 10, date, car } = request.query;
  const query = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.created_at = { $gte: startDate, $lt: endDate };
  }
  if (car) query.car = car;
  try {
    const checklists = await MaterialChecklist.find(query)
      .populate("user", "first_name last_name _id")
      .populate("car", "name _id meta")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
      .exec();
    return { checklists, page, limit };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getMaterialChecklist = async (request, reply) => {
  try {
    const checklist = await MaterialChecklist.findOne({
      _id: request.params.id,
    }).exec();
    return checklist;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateMaterialChecklist = async (request, reply) => {
  const { checklist, user } = request.body;
  const updates = {};
  if (checklist) updates.checklist = checklist;
  if (user) updates.user = user;
  updates.updated_at = Date.now();
  try {
    const checklist = await MaterialChecklist.updateOne(
      { _id: request.params.id },
      { $set: updates }
    );
    reply.send(checklist);
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const deleteMaterialChecklist = async (request, reply) => {
  try {
    await MaterialChecklist.deleteOne({
      _id: request.params.id,
    });
    reply.send({ message: request.params.id + " checklist deleted" });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const materialChecklistRoutes = () => {
  fastify.post("/api/material-checklist", createMaterialChecklist);
  fastify.get("/api/material-checklist", listMaterialChecklists);
  fastify.get("/api/material-checklist/:id", getMaterialChecklist);
  fastify.put("/api/material-checklist/:id", updateMaterialChecklist);
  fastify.delete("/api/material-checklist/:id", deleteMaterialChecklist);
};

module.exports = materialChecklistRoutes;
