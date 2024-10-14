// schema/carChecklist.schema.js
const { Schema, default: mongoose } = require("mongoose");

const materialChecklistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const MaterialChecklist = mongoose.model(
  "MaterialChecklist",
  materialChecklistSchema
);

module.exports = { materialChecklistSchema, MaterialChecklist };
