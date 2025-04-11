const { Car } = require("../schema/car.schema");
const { initializeCarInventory } = require("./carInventory");

async function initializeAllCarsInventory() {
  try {
    console.log("Starting inventory initialization for all cars...");

    // Get all cars
    const cars = await Car.find({});
    console.log(`Found ${cars.length} cars to initialize inventory for`);

    // Initialize inventory for each car
    for (const car of cars) {
      await initializeCarInventory(car._id);
    }

    console.log("Completed inventory initialization for all cars");
  } catch (error) {
    console.error("Error initializing inventory for all cars:", error);
    throw error;
  }
}

module.exports = { initializeAllCarsInventory };
