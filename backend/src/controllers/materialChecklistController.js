// controllers/materialChecklistController.js

const { fastify } = require("../init");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const InventoryService = require("../services/InventoryService");
const FormatterService = require("../services/FormatterService");
const ErrorHandlerService = require("../services/ErrorHandlerService");
const LoggingService = require("../services/LoggingService");
const { printMaterialChecklist } = require("./pdfController");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("MaterialChecklistController");

const createMaterialChecklist = async (request, reply) => {
  try {
    logger.debug("Creating new material checklist");
    const { car, items, checklist, user } = request.body;

    // Create the checklist
    const materialChecklist = new MaterialChecklist({
      car,
      items,
      user,
    });
    await materialChecklist.save();

    // Update inventory based on checklist items
    try {
      await InventoryService.updateFromMaterialChecklist(car, items, user);
      logger.debug("Updated inventory based on checklist items");
    } catch (inventoryError) {
      logger.error("Error updating inventory", inventoryError);
      // Continue execution even if inventory update fails
    }

    // Generate PDF and save filename to checklist
    const pdfResult = await printMaterialChecklist(materialChecklist._id, checklist);
    
    if (pdfResult.statusCode === 200 && pdfResult.filename) {
      materialChecklist.pdf_filename = pdfResult.filename;
      await materialChecklist.save();
      logger.debug(`Saved PDF filename to checklist: ${materialChecklist.pdf_filename}`);
    }

    // Populate the response with item details
    const populatedChecklist = await MaterialChecklist.findById(
      materialChecklist._id
    )
      .populate({
        path: "items.item",
        model: "InventoryItem",
      })
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id");

    return FormatterService.formatResponse(populatedChecklist, {
      message: "Material checklist created successfully",
    });
  } catch (err) {
    logger.error("Error creating material checklist", err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const listMaterialChecklists = async (request, reply) => {
  try {
    logger.debug("Listing material checklists");
    const { page = 1, limit = 10, date, car } = request.query;
    const query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.created_at = { $gte: startDate, $lt: endDate };
    }

    if (car) query.car = car;

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

    const total = await MaterialChecklist.countDocuments(query);

    return FormatterService.formatPaginated(checklists, page, limit, total);
  } catch (err) {
    logger.error("Error listing material checklists", err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const getMaterialChecklist = async (request, reply) => {
  try {
    logger.debug(`Getting material checklist ${request.params.id}`);
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

    if (!checklist) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Material checklist not found"
      );
    }

    return FormatterService.formatResponse(checklist);
  } catch (err) {
    logger.error(`Error getting material checklist ${request.params.id}`, err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const updateMaterialChecklist = async (request, reply) => {
  try {
    logger.debug(`Updating material checklist ${request.params.id}`);
    const { car, user, items, photos } = request.body;
    const updates = {};

    if (items) updates.items = items;
    if (photos) updates.photos = photos;
    updates.updated_at = new Date();

    const checklist = await MaterialChecklist.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      { new: true }
    );

    if (!checklist) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Material checklist not found"
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
      message: "Material checklist updated successfully",
    });
  } catch (err) {
    logger.error(`Error updating material checklist ${request.params.id}`, err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

const deleteMaterialChecklist = async (request, reply) => {
  try {
    logger.debug(`Deleting material checklist ${request.params.id}`);
    const result = await MaterialChecklist.deleteOne({
      _id: request.params.id,
    });

    if (result.deletedCount === 0) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Material checklist not found"
      );
    }

    return FormatterService.formatResponse(null, {
      message: "Material checklist deleted successfully",
    });
  } catch (err) {
    logger.error(`Error deleting material checklist ${request.params.id}`, err);
    return ErrorHandlerService.handleError(err, reply);
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
