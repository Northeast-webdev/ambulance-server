// schema/carChecklist.schema.js
const { Schema, default: mongoose } = require("mongoose");

const materialChecklistItemSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "InventoryItem" },
  quantity: { type: Number },
  notes: { type: String },
});

const materialChecklistSchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  items: [materialChecklistItemSchema],
  photos: [{ type: String }],
  pdf_filename: { type: String }, // Stores the generated PDF filename
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const MaterialChecklist = mongoose.model(
  "MaterialChecklist",
  materialChecklistSchema
);

module.exports = {
  materialChecklistSchema,
  MaterialChecklist,
  materialChecklistItemSchema,
};
