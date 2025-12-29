/**
 * InventoryService.js
 * Service for managing inventory operations and synchronization with checklists
 */

const { InventoryItem, CarInventory } = require("../schema/inventory.schema");
const LoggingService = require("./LoggingService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("InventoryService");

class InventoryService {
  /**
   * Update inventory based on checklist items
   * @param {String} carId - Car ID
   * @param {Array} items - Checklist items with quantities
   * @param {String} userId - User who updated the checklist
   * @returns {Array} - Updated inventory items
   */
  static async updateFromChecklist(carId, items, userId) {
    try {
      logger.debug(`Updating inventory for car ${carId} from checklist`);
      
      // Guard clause: check if items is defined and is an array
      if (!items || !Array.isArray(items)) {
        logger.warn(`Items is undefined or not an array for car ${carId}`);
        return [];
      }
      
      const inventoryUpdates = items.map(async (checklistItem) => {
        // checklistItem.item is an ObjectId reference, we need to find by that ID
        const inventoryItem = checklistItem.item ? await InventoryItem.findById(checklistItem.item) : null;
        if (inventoryItem) {
          await CarInventory.findOneAndUpdate(
            { car: carId, item: inventoryItem._id },
            {
              quantity: checklistItem.is_present ? 1 : 0, // For car items, quantity is 1 if present, 0 if not
              updated_by: userId,
              last_updated: new Date(),
            },
            { upsert: true, new: true }
          );
        }
      });

      await Promise.all(inventoryUpdates);

      logger.info(
        `Updated ${inventoryUpdates.length} inventory items for car ${carId}`
      );
      return inventoryUpdates;
    } catch (error) {
      logger.error(
        `Error updating inventory from checklist: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Update inventory based on material checklist items
   * @param {String} carId - Car ID
   * @param {Array} items - Checklist items with quantities
   * @param {String} userId - User who updated the checklist
   * @returns {Boolean} - Whether the inventory was updated successfully
   */
  static async updateFromMaterialChecklist(carId, items, userId) {
    try {
      logger.debug(`Updating inventory for car ${carId} from checklist`);
      items.map(async (item) => {
        item.map(async (i) => {
          const inventoryItem = await InventoryItem.findOne({ name: i.name });
          if (inventoryItem) {
            await CarInventory.findOneAndUpdate(
              { car: carId, item: inventoryItem._id },
              {
                quantity: isNaN(Number(i.quantity)) ? 1 : Number(i.quantity),
                updated_by: userId,
                last_updated: new Date(),
              },
              { upsert: true, new: true }
            );
          }
        });
      });

      logger.info(`Updated ${items.length} inventory items for car ${carId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error updating inventory from checklist: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all inventory items for a car
   * @param {String} carId - Car ID
   * @returns {Array} - Car inventory items
   */
  static async getCarInventory(carId) {
    try {
      logger.debug(`Getting inventory for car ${carId}`);

      const inventory = await CarInventory.find({ car: carId })
        .populate("item")
        .populate("updated_by", "first_name last_name")
        .sort({ "item.category": 1, "item.name": 1 });

      return inventory;
    } catch (error) {
      logger.error(`Error getting car inventory: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get low inventory items for a car
   * @param {String} carId - Car ID
   * @returns {Array} - Low inventory items
   */
  static async getLowInventoryItems(carId) {
    try {
      logger.debug(`Checking for low inventory items for car ${carId}`);

      const inventory = await InventoryService.getCarInventory(carId);

      // Filter items that are below minimum quantity
      const lowItems = inventory.filter((item) => {
        const minimumQuantity = item.item.minimum_quantity || 1;
        return item.quantity < minimumQuantity;
      });

      logger.debug(
        `Found ${lowItems.length} low inventory items for car ${carId}`
      );
      return lowItems;
    } catch (error) {
      logger.error(
        `Error getting low inventory items: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Validate inventory quantity change
   * @param {Object} item - Inventory item
   * @param {Number} newQuantity - New quantity
   * @returns {Boolean} - Whether the quantity change is valid
   */
  static validateQuantityChange(item, newQuantity) {
    // Basic validation rules
    if (newQuantity < 0) return false;

    // Car items can only be 0 or 1
    if (item.type === "car" && ![0, 1].includes(newQuantity)) {
      return false;
    }

    // Additional validation can be added here

    return true;
  }

  /**
   * Initialize inventory for a new car
   * @param {String} carId - Car ID
   * @returns {Array} - Created inventory items
   */
  static async initializeCarInventory(carId) {
    try {
      logger.debug(`Initializing inventory for car ${carId}`);

      // Get all inventory items
      const items = await InventoryItem.find({});

      const results = [];

      // Create inventory entries for each item
      for (const item of items) {
        const defaultQuantity =
          item.type === "car" ? 1 : item.minimum_quantity || 0;

        const inventoryItem = await CarInventory.findOneAndUpdate(
          { car: carId, item: item._id },
          {
            car: carId,
            item: item._id,
            quantity: defaultQuantity,
            updated_by: null,
            last_updated: new Date(),
          },
          { upsert: true, new: true }
        );

        results.push(inventoryItem);
      }

      logger.info(
        `Initialized ${results.length} inventory items for car ${carId}`
      );
      return results;
    } catch (error) {
      logger.error(`Error initializing car inventory: ${error.message}`, error);
      throw error;
    }
  }
}

module.exports = InventoryService;
