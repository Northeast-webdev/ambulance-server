const { CarInventory } = require("../schema/inventory.schema");
const { InventoryItem } = require("../schema/inventory.schema");

async function initializeCarInventory(carId) {
  try {
    // Get all inventory items
    const items = await InventoryItem.find({});

    // Create inventory entries for each item
    const inventoryPromises = items.map((item) => {
      return CarInventory.findOneAndUpdate(
        { car: carId, item: item._id },
        {
          car: carId,
          item: item._id,
          quantity: item.type === "car" ? 1 : item.minimum_quantity, // Car items are always quantity 1
          updated_by: null, // System update
          last_updated: new Date(),
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(inventoryPromises);
    console.log(`Initialized inventory for car ${carId}`);
  } catch (error) {
    console.error(`Error initializing inventory for car ${carId}:`, error);
    throw error;
  }
}

module.exports = { initializeCarInventory };
