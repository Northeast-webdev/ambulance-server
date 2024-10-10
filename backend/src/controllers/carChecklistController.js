// controllers/carChecklistController.js

const { fastify } = require("../init");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { User } = require("../schema/user.schema");
const { printCarChecklist, findPDF } = require("./pdfController");

const createCarChecklist = async (request, reply) => {
  const { car, checklist, user } = request.body;
  const carChecklist = new CarChecklist({ car, checklist, user });
  const userExists = await User.findOne({ _id: user });
  try {
    await carChecklist.save();
    if (userExists) {
      await User.updateOne(
        { _id: user },
        { $push: { car_checklists: carChecklist._id } }
      );
    }

    // print the pdf here
    printCarChecklist({
      checklistId: carChecklist._id,
    });
    reply.send(carChecklist);
  } catch (err) {
    console.log(err);
    reply.code(500).send({ error: err });
  }
};

const listCarChecklists = async (request, reply) => {
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
    const checklists = await CarChecklist.find(query)
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: 1 })
      .exec();
    return { checklists, page, limit };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getCarChecklist = async (request, reply) => {
  try {
    const checklist = await CarChecklist.findOne({
      _id: request.params.id,
    }).exec();
    return checklist;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateCarChecklist = async (request, reply) => {
  const { car, checklist, user } = request.body;
  const updates = {};
  if (car) updates.car = car;
  if (checklist) updates.checklist = checklist;
  if (user) updates.user = user;
  updates.updated_at = Date.now();
  try {
    const checklist = await CarChecklist.updateOne(
      { _id: request.params.id },
      { $set: updates }
    );
    reply.send(checklist);
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const deleteCarChecklist = async (request, reply) => {
  try {
    await CarChecklist.deleteOne({
      _id: request.params.id,
    });
    reply.send({ message: request.params.id + " checklist deleted" });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getPdfForCarChecklist = async (request, reply) => {
  const { id } = request.params;
  await findPDF({ checklistId: id }, reply);
};

const carChecklistRoutes = () => {
  fastify.post("/api/car-checklist", createCarChecklist);
  fastify.get("/api/car-checklist", listCarChecklists);
  fastify.get("/api/car-checklist/:id", getCarChecklist);
  fastify.put("/api/car-checklist/:id", updateCarChecklist);
  fastify.delete("/api/car-checklist/:id", deleteCarChecklist);
  // get pdf for car checklist
  fastify.get("/api/checklist/:id/pdf", getPdfForCarChecklist);
};

module.exports = carChecklistRoutes;
