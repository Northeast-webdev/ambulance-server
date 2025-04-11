// controllers/materialChecklistController.js

const { fastify } = require("../init");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { CarInventory } = require("../schema/inventory.schema");
const { printMaterialChecklist, findPDF } = require("./pdfController");

const createMaterialChecklist = async (request, reply) => {
  const { car, user, items, photos } = request.body;
  try {
    const checklist = new MaterialChecklist({
      car,
      user,
      items,
      photos,
    });
    await checklist.save();

    // Update inventory based on checklist items
    const inventoryUpdates = items.map(async (item) => {
      if (item.quantity !== undefined) {
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

    // Generate PDF
    await printMaterialChecklist({
      checklistId: checklist._id,
      items: checklist.items,
      photos,
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
        if (item.quantity !== undefined) {
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

const getPdfForMaterialChecklist = async (request, reply) => {
  const { id } = request.params;
  try {
    await findPDF({ checklistId: id }, reply);
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
  fastify.get("/api/checklist/:id/pdf", getPdfForMaterialChecklist);
};

module.exports = materialChecklistRoutes;
