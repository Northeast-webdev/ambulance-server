// controllers/carChecklistController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { User } = require("../schema/user.schema");
const { printCarChecklist, findPDF } = require("./pdfController");
const { CarInventory } = require("../schema/inventory.schema");

const createCarChecklist = async (request, reply) => {
  const { car, user, items, photos } = request.body;
  try {
    const checklist = new CarChecklist({
      car,
      user,
      items,
      photos,
    });
    await checklist.save();

    // Update inventory based on checklist items
    const inventoryUpdates = items.map(async (item) => {
      if (!item.is_present && item.quantity !== undefined) {
        // Update inventory quantity for non-car-checklist items
        await CarInventory.findOneAndUpdate(
          { car, item: item.item },
          {
            quantity: item.quantity,
            updated_by: user,
            last_updated: new Date(),
          },
          { upsert: true }
        );
      }
    });

    await Promise.all(inventoryUpdates);
    await printCarChecklist({
      checklistId: checklist._id,
      items: checklist.items,
      photos: photos,
    });
    // Populate the response with item details
    const populatedChecklist = await CarChecklist.findById(checklist._id)
      .populate({
        path: "items.item",
        model: "InventoryItem",
      })
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id");

    return populatedChecklist;
  } catch (err) {
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
      .sort({ created_at: -1 })
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
