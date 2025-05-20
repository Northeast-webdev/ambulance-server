const { fastify } = require("../init");
const { InventoryItem } = require("../schema/inventory.schema");
const InventoryService = require("../services/InventoryService");
const FormatterService = require("../services/FormatterService");
const ErrorHandlerService = require("../services/ErrorHandlerService");
const LoggingService = require("../services/LoggingService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("InventoryController");

// Create a new inventory item
const createInventoryItem = async (request, reply) => {
  try {
    logger.debug("Creating new inventory item");
    const {
      name,
      description,
      unit,
      minimum_quantity,
      type,
      category,
      subcategory,
    } = request.body;

    const item = new InventoryItem({
      name,
      description,
      unit,
      minimum_quantity,
      type,
      category,
      subcategory,
    });

    await item.save();

    return FormatterService.formatResponse(item, {
      message: "Inventory item created successfully",
    });
  } catch (err) {
    logger.error("Error creating inventory item", err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

// List all inventory items
const listInventoryItems = async (request, reply) => {
  try {
    logger.debug("Listing inventory items");
    const { type, category } = request.query;
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;

    const items = await InventoryItem.find(query).sort({ name: 1 });

    return FormatterService.formatResponse(items);
  } catch (err) {
    logger.error("Error listing inventory items", err);
    return ErrorHandlerService.handleError(err, reply);
  }
};

// Get car inventory
const getCarInventory = async (request, reply) => {
  try {
    logger.debug(`Getting inventory for car ${request.params.carId}`);
    const inventory = await InventoryService.getCarInventory(
      request.params.carId
    );

    return FormatterService.formatResponse(inventory);
  } catch (err) {
    logger.error(
      `Error getting car inventory for ${request.params.carId}`,
      err
    );
    return ErrorHandlerService.handleError(err, reply);
  }
};

// Update car inventory
const updateCarInventory = async (request, reply) => {
  try {
    logger.debug(`Updating inventory for car ${request.params.carId}`);
    const { carId } = request.params;
    const { itemId, quantity, userId } = request.body;

    if (!itemId || quantity === undefined) {
      return ErrorHandlerService.handleBadRequest(
        reply,
        "Item ID and quantity are required"
      );
    }

    // Get the inventory item to validate the quantity
    const inventoryItem = await InventoryItem.findById(itemId);
    if (!inventoryItem) {
      return ErrorHandlerService.handleNotFound(
        reply,
        "Inventory item not found"
      );
    }

    // Validate the quantity change
    if (!InventoryService.validateQuantityChange(inventoryItem, quantity)) {
      return ErrorHandlerService.handleBadRequest(
        reply,
        "Invalid quantity value for this item type"
      );
    }

    // Update the inventory item
    await InventoryService.updateFromChecklist(
      carId,
      [
        {
          item: inventoryItem,
          quantity: quantity,
          is_present: quantity > 0,
        },
      ],
      userId
    );

    // Return updated inventory
    const updatedInventory = await InventoryService.getCarInventory(carId);

    return FormatterService.formatResponse(updatedInventory, {
      message: "Inventory updated successfully",
    });
  } catch (err) {
    logger.error(
      `Error updating car inventory for ${request.params.carId}`,
      err
    );
    return ErrorHandlerService.handleError(err, reply);
  }
};

// Get low inventory items for a car
const getLowInventory = async (request, reply) => {
  try {
    logger.debug(`Getting low inventory items for car ${request.params.carId}`);
    const lowItems = await InventoryService.getLowInventoryItems(
      request.params.carId
    );

    return FormatterService.formatResponse(lowItems);
  } catch (err) {
    logger.error(
      `Error getting low inventory items for ${request.params.carId}`,
      err
    );
    return ErrorHandlerService.handleError(err, reply);
  }
};

// Get inventory status with low items highlighted
const getInventoryStatus = async (request, reply) => {
  try {
    logger.debug(`Getting inventory status for car ${request.params.carId}`);
    const { carId } = request.params;

    // Get full inventory and low items
    const [inventory, lowItems] = await Promise.all([
      InventoryService.getCarInventory(carId),
      InventoryService.getLowInventoryItems(carId),
    ]);

    // Create a set of low item IDs for quick lookup
    const lowItemIds = new Set(
      lowItems.map((item) => item.item._id.toString())
    );

    // Add a 'low_inventory' flag to each item
    const inventoryWithStatus = inventory.map((item) => ({
      ...item.toObject(),
      low_inventory: lowItemIds.has(item.item._id.toString()),
    }));

    // Group items by category for better UI organization
    const groupedInventory = inventoryWithStatus.reduce((groups, item) => {
      const category = item.item.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});

    return FormatterService.formatResponse({
      inventory: groupedInventory,
      low_items_count: lowItems.length,
      total_items_count: inventory.length,
    });
  } catch (err) {
    logger.error(
      `Error getting inventory status for ${request.params.carId}`,
      err
    );
    return ErrorHandlerService.handleError(err, reply);
  }
};

// Initialize inventory for a car
const initializeInventory = async (request, reply) => {
  try {
    logger.debug(`Initializing inventory for car ${request.params.carId}`);
    const { carId } = request.params;

    const inventoryItems = await InventoryService.initializeCarInventory(carId);

    return FormatterService.formatResponse(inventoryItems, {
      message: `Initialized ${inventoryItems.length} inventory items for car ${carId}`,
    });
  } catch (err) {
    logger.error(
      `Error initializing inventory for ${request.params.carId}`,
      err
    );
    return ErrorHandlerService.handleError(err, reply);
  }
};

const inventoryRoutes = () => {
  // Inventory items CRUD
  fastify.post(
    "/api/inventory/items",
    { preHandler: [fastify.authenticate] },
    createInventoryItem
  );
  fastify.get(
    "/api/inventory/items",
    { preHandler: [fastify.authenticate] },
    listInventoryItems
  );

  // Car inventory routes
  fastify.get(
    "/api/inventory/cars/:carId",
    { preHandler: [fastify.authenticate] },
    getCarInventory
  );
  fastify.put(
    "/api/inventory/cars/:carId",
    { preHandler: [fastify.authenticate] },
    updateCarInventory
  );
  fastify.get(
    "/api/inventory/cars/:carId/low",
    { preHandler: [fastify.authenticate] },
    getLowInventory
  );

  // New routes
  fastify.get(
    "/api/inventory/cars/:carId/status",
    { preHandler: [fastify.authenticate] },
    getInventoryStatus
  );
  fastify.post(
    "/api/inventory/cars/:carId/initialize",
    { preHandler: [fastify.authenticate] },
    initializeInventory
  );
};

module.exports = inventoryRoutes;
