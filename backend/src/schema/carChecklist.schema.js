// schema/carChecklist.schema.js
const { Schema, default: mongoose } = require("mongoose");

const checklistItemSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "InventoryItem" },
  quantity: { type: Number }, // Only used for non-car-checklist items
  is_present: { type: Boolean }, // Used for car checklist items (true/false)
  notes: { type: String },
});

const carChecklistSchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  items: [checklistItemSchema],
  photos: [{ type: String }],
  pdf_filename: { type: String }, // Stores the generated PDF filename
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const CarChecklist = mongoose.model("CarChecklist", carChecklistSchema);

module.exports = { carChecklistSchema, CarChecklist, checklistItemSchema };
