const { Schema, default: mongoose } = require("mongoose");

const inventoryItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  minimum_quantity: { type: Number, default: 0 },
  is_car_checklist_item: { type: Boolean, default: false }, // true if this item appears in car checklists
  is_material_checklist_item: { type: Boolean, default: false },
  category: { type: String }, // e.g., "VANO SANITARIO", "TRAUMA", etc.
  subcategory: { type: String }, // e.g., "Rianimazione", "Zaino trauma", etc.
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const carInventorySchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: "Car", required: true },
  item: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
  quantity: { type: Number, required: true, default: 0 },
  last_updated: { type: Date, default: Date.now },
  updated_by: { type: Schema.Types.ObjectId, ref: "User" },
});

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
const CarInventory = mongoose.model("CarInventory", carInventorySchema);

module.exports = {
  InventoryItem,
  CarInventory,
  inventoryItemSchema,
  carInventorySchema,
};
