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

      const updates = [];

      // Process each item from the checklist
      for (const item of items) {
        // Skip items without a valid item reference
        if (!item.item || !item.item._id) {
          logger.warn(`Skipping invalid item in checklist for car ${carId}`);
          continue;
        }

        const itemId = item.item._id;
        // Determine the quantity based on item type
        // For car items: if is_present is true, set to 1, otherwise 0
        // For material items: use the quantity field
        const quantity =
          item.item.type === "car"
            ? item.is_present
              ? 1
              : 0
            : item.quantity || 0;

        // Validate the quantity change
        if (!InventoryService.validateQuantityChange(item.item, quantity)) {
          logger.warn(
            `Invalid quantity change for item ${itemId} in car ${carId}`
          );
          continue;
        }

        // Update the inventory
        const updatedItem = await CarInventory.findOneAndUpdate(
          { car: carId, item: itemId },
          {
            quantity,
            updated_by: userId,
            last_updated: new Date(),
          },
          { new: true }
        ).populate("item");

        if (updatedItem) {
          updates.push(updatedItem);
        }
      }

      logger.info(`Updated ${updates.length} inventory items for car ${carId}`);
      return updates;
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
