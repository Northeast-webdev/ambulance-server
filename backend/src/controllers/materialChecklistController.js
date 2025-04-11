// controllers/materialChecklistController.js

const { fastify } = require("../init");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { CarInventory } = require("../schema/inventory.schema");
const { InventoryItem } = require("../schema/inventory.schema");
const { printMaterialChecklist } = require("./pdfController");

const createMaterialChecklist = async (request, reply) => {
  try {
    const { car, items, checklist, user } = request.body;

    // Create the checklist
    const materialChecklist = new MaterialChecklist({
      car,
      items,
      checklist,
      user,
    });
    await materialChecklist.save();

    // Update inventory based on checklist items
    const inventoryUpdates = items.map(async (item) => {
      const inventoryItem = await InventoryItem.findOne({ name: item.name });
      if (inventoryItem) {
        await CarInventory.findOneAndUpdate(
          { car, item: inventoryItem._id },
          {
            quantity: item.quantity,
            updated_by: user,
            last_updated: new Date(),
          },
          { upsert: true, new: true }
        );
      }
    });

    await Promise.all(inventoryUpdates);

    // Generate PDF
    await printMaterialChecklist({
      checklistId: materialChecklist._id,
      checklist: checklist,
    });

    // Populate the response with item details
    const populatedChecklist = await MaterialChecklist.findById(checklist._id)
      .populate({
        path: "items.item",
        model: "InventoryItem",
      })
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id");

    return populatedChecklist;
  } catch (err) {
    console.log(err);
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
      .populate({
        path: "items.item",
        model: "InventoryItem",
      })
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

const getMaterialChecklist = async (request, reply) => {
  try {
    const checklist = await MaterialChecklist.findOne({
      _id: request.params.id,
    })
      .populate({
        path: "items.item",
        model: "InventoryItem",
      })
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id")
      .exec();
    return checklist;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateMaterialChecklist = async (request, reply) => {
  const { car, user, items, photos } = request.body;
  const updates = {};
  if (items) updates.items = items;
  if (photos) updates.photos = photos;
  updates.updated_at = new Date();

  try {
    const checklist = await MaterialChecklist.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      { new: true }
    );

    // Update inventory if items were changed
    if (items) {
      const inventoryUpdates = items.map(async (item) => {
        const inventoryItem = await InventoryItem.findOne({ name: item.name });
        if (inventoryItem) {
          await CarInventory.findOneAndUpdate(
            { car, item: inventoryItem._id },
            {
              quantity: item.quantity,
              updated_by: user,
              last_updated: new Date(),
            },
            { upsert: true, new: true }
          );
        }
      });
      await Promise.all(inventoryUpdates);
    }

    return checklist;
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
