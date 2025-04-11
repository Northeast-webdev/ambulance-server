const { CarInventory } = require("../schema/inventory.schema");
const { InventoryItem } = require("../schema/inventory.schema");

async function initializeCarInventory(carId) {
  try {
    // Get all material checklist items
    const materialItems = await InventoryItem.find({
      is_material_checklist_item: true,
    });

    // Create inventory entries for each item
    const inventoryPromises = materialItems.map((item) => {
      return CarInventory.findOneAndUpdate(
        { car: carId, item: item._id },
        {
          car: carId,
          item: item._id,
          quantity: item.minimum_quantity,
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
