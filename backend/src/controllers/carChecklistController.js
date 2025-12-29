// controllers/carChecklistController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { User } = require("../schema/user.schema");
const { printCarChecklist, findPDF } = require("./pdfController");
const InventoryService = require("../services/InventoryService");
const FormatterService = require("../services/FormatterService");
const ErrorHandlerService = require("../services/ErrorHandlerService");
const LoggingService = require("../services/LoggingService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("CarChecklistController");

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
    logger.debug("Creating new car checklist");
    const { car, items, checklist: checklistData, photos, user } = request.body;

    // Convert checklist object format to items array format if needed
    // App sends: { checklist: { luciPosizioneAnteriori: true, ... } }
    // Server needs: items array with { name, is_present }
    let checklistItems = items;
    if (!items && checklistData && typeof checklistData === 'object') {
      checklistItems = Object.entries(checklistData).map(([key, value]) => ({
        name: labels[key] || key,
        is_present: Boolean(value),
      }));
      logger.debug(`Converted checklist object to ${checklistItems.length} items`);
    }

    // Create the checklist
    const checklist = new CarChecklist({
      car,
      items: checklistItems,
      photos,
      user,
    });
    await checklist.save();

    // Update inventory based on checklist items
    try {
      await InventoryService.updateFromChecklist(car, checklistItems, user);
      logger.debug("Updated inventory based on checklist items");
    } catch (inventoryError) {
      logger.error("Error updating inventory", inventoryError);
      // Continue execution even if inventory update fails
    }

    // Generate PDF
    await printCarChecklist({
      checklistId: checklist._id,
      items: checklistItems,
      photos: photos,
    });

    return FormatterService.formatResponse(checklist, {
      message: "Car checklist created successfully",
    });
  } catch (err) {
    logger.error("Error creating car checklist", err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const listCarChecklists = async (request, reply) => {
  try {
    logger.debug("Listing car checklists");
    const { page = 1, limit = 10, date, car } = request.query;
    const query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.created_at = { $gte: startDate, $lt: endDate };
    }

    if (car) query.car = car;

    const checklists = await CarChecklist.find(query)
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
      .exec();

    const total = await CarChecklist.countDocuments(query);

    return FormatterService.formatPaginated(checklists, page, limit, total);
  } catch (err) {
    logger.error("Error listing car checklists", err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const getCarChecklist = async (request, reply) => {
  try {
    logger.debug(`Getting car checklist ${request.params.id}`);
    const checklist = await CarChecklist.findOne({
      _id: request.params.id,
    })
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id")
      .exec();

    if (!checklist) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Car checklist not found"
      );
    }

    return FormatterService.formatResponse(checklist);
  } catch (err) {
    logger.error(`Error getting car checklist ${request.params.id}`, err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const updateCarChecklist = async (request, reply) => {
  try {
    logger.debug(`Updating car checklist ${request.params.id}`);
    const { car, items, user } = request.body;
    const updates = {};

    if (car) updates.car = car;
    if (items) updates.items = items;
    if (user) updates.user = user;
    updates.updated_at = new Date();

    const checklist = await CarChecklist.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      { new: true }
    );

    if (!checklist) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Car checklist not found"
      );
    }

    // Update inventory if items were changed
    if (items) {
      try {
        await InventoryService.updateFromChecklist(car, items, user);
        logger.debug("Updated inventory based on checklist items");
      } catch (inventoryError) {
        logger.error("Error updating inventory", inventoryError);
        // Continue execution even if inventory update fails
      }
    }

    return FormatterService.formatResponse(checklist, {
      message: "Car checklist updated successfully",
    });
  } catch (err) {
    logger.error(`Error updating car checklist ${request.params.id}`, err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const deleteCarChecklist = async (request, reply) => {
  try {
    logger.debug(`Deleting car checklist ${request.params.id}`);
    const result = await CarChecklist.deleteOne({
      _id: request.params.id,
    });

    if (result.deletedCount === 0) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Car checklist not found"
      );
    }

    return FormatterService.formatResponse(null, {
      message: "Car checklist deleted successfully",
    });
  } catch (err) {
    logger.error(`Error deleting car checklist ${request.params.id}`, err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const getPdfForCarChecklist = async (request, reply) => {
  try {
    logger.debug(`Getting PDF for car checklist ${request.params.id}`);
    const { id } = request.params;
    await findPDF({ checklistId: id }, reply);
  } catch (err) {
    logger.error(
      `Error getting PDF for car checklist ${request.params.id}`,
      err
    );
    return ErrorHandlerService.handleError(err, reply);
  }
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
