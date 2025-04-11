// controllers/carChecklistController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { User } = require("../schema/user.schema");
const { printCarChecklist, findPDF } = require("./pdfController");
const { CarInventory } = require("../schema/inventory.schema");
const { InventoryItem } = require("../schema/inventory.schema");

const labels = {
  luciPosizioneAnteriori: "Luci posizione anteriori",
  anabbaglianti: "Anabbaglianti",
  abbaglianti: "Abbaglianti",
  fendinebbia: "Fendinebbia",
  frecceAnteriori: "Frecce anteriori",
  luciPosizionePosteriori: "Luci posizione posteriori",
  luciStop: "Luci stop",
  luciRetromarcia: "Luci retromarcia",
  retronebbia: "Retronebbia",
  freccePosteriori: "Frecce posteriori",
  luceTarga: "Luce targa",
  lampeggianti: "Lampeggianti",
  strobo: "Strobo",
  fariAusiliari: "Fari ausiliari",
  sirene: "Sirene (no dopo le ore 22)",
  triangoloEmergenza: "Triangolo emergenza",
  torcia: "Torcia",
  kitSostituzionePneumatico: "Kit sostituzione pneumatico",
  kitAntiscasso: "Kit antiscasso",
  ruotaDiScorta: "Ruota di scorta",
  cateneDaNeve: "Catene da neve",
  documentiNecessari: "Documenti necessari",
  carbon_level: "Livello carburante",
  kilometers: "Chilometri",
};
const createCarChecklist = async (request, reply) => {
  try {
    const { car, items, notes, user } = request.body;

    // Create the checklist
    const checklist = new CarChecklist({
      car,
      items,
      notes,
      user,
    });
    await checklist.save();

    // Update inventory based on checklist items
    const inventoryUpdates = items.map(async (item) => {
      const inventoryItem = await InventoryItem.findOne({ name: item.name });
      if (inventoryItem) {
        await CarInventory.findOneAndUpdate(
          { car, item: inventoryItem._id },
          {
            quantity: item.is_present ? 1 : 0, // For car items, quantity is 1 if present, 0 if not
            updated_by: user,
            last_updated: new Date(),
          },
          { upsert: true, new: true }
        );
      }
    });

    await Promise.all(inventoryUpdates);

    // Generate PDF
    await printCarChecklist({
      checklistId: checklist._id,
      items: checklist.items,
      photos: checklist.photos,
    });

    return checklist;
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
