const { fastify } = require("../init");
const { InventoryItem, CarInventory } = require("../schema/inventory.schema");
const { Car } = require("../schema/car.schema");

// Create a new inventory item
const createInventoryItem = async (request, reply) => {
  const { name, description, unit, minimum_quantity, is_car_checklist_item } =
    request.body;
  try {
    const item = new InventoryItem({
      name,
      description,
      unit,
      minimum_quantity,
      is_car_checklist_item,
    });
    await item.save();
    return item;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

// List all inventory items
const listInventoryItems = async (request, reply) => {
  const { is_car_checklist_item } = request.query;
  const query = {};
  if (is_car_checklist_item !== undefined) {
    query.is_car_checklist_item = is_car_checklist_item === "true";
  }
  try {
    const items = await InventoryItem.find(query).sort({ name: 1 });
    return items;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

// Get car inventory
const getCarInventory = async (request, reply) => {
  try {
    const inventory = await CarInventory.find({ car: request.params.carId })
      .populate("item")
      .populate("updated_by", "first_name last_name");
    return inventory;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

// Update car inventory
const updateCarInventory = async (request, reply) => {
  const { carId } = request.params;
  const { items } = request.body;
  const userId = request.user._id; // Assuming user info is added by authentication

  try {
    const updates = items.map(async (item) => {
      return CarInventory.findOneAndUpdate(
        { car: carId, item: item.itemId },
        {
          quantity: item.quantity,
          updated_by: userId,
          last_updated: new Date(),
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updates);

    // Return updated inventory
    const updatedInventory = await CarInventory.find({ car: carId })
      .populate("item")
      .populate("updated_by", "first_name last_name");

    return updatedInventory;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

// Get low inventory items for a car
const getLowInventory = async (request, reply) => {
  try {
    const inventory = await CarInventory.find({ car: request.params.carId })
      .populate("item")
      .populate("updated_by", "first_name last_name");

    const lowItems = inventory.filter(
      (inv) => inv.quantity < inv.item.minimum_quantity
    );

    return lowItems;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const inventoryRoutes = () => {
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
};

module.exports = inventoryRoutes;
