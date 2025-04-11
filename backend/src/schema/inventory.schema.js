const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  unit: { type: String },
  minimum_quantity: { type: Number, required: true },
  type: {
    type: String,
    enum: ["material", "car"],
    required: true,
  },
  category: { type: String },
  subcategory: { type: String },
});

const carInventorySchema = new mongoose.Schema({
  car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
  },
  quantity: { type: Number, required: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  last_updated: { type: Date, default: Date.now },
});

// Create compound index to ensure unique car-item combinations
carInventorySchema.index({ car: 1, item: 1 }, { unique: true });

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
const CarInventory = mongoose.model("CarInventory", carInventorySchema);

module.exports = { InventoryItem, CarInventory };
