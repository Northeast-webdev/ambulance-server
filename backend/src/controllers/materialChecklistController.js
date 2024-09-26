// controllers/materialChecklistController.js

const { fastify } = require("../init");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { User } = require("../schema/user.schema");
const { printMaterialChecklist } = require("./pdfController");

const createMaterialChecklist = async (request, reply) => {
  const { checklist, user, car } = request.body;
  const materialChecklist = new MaterialChecklist({ checklist, user, car });
  const userExists = await User.findOne({ _id: user });
  try {
    await materialChecklist.save();
    if (userExists) {
      await User.updateOne(
        { _id: user },
        { $push: { material_checklists: materialChecklist._id } }
      );
    }

    // print the pdf here
    printMaterialChecklist({
      checklistId: materialChecklist._id,
    });
    reply.send(materialChecklist);
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const listMaterialChecklists = async (request, reply) => {
  const { page = 1, limit = 10 } = request.query;
  try {
    const checklists = await MaterialChecklist.find()
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
