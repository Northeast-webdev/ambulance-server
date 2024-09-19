// schema/carChecklist.schema.js
const { Schema, default: mongoose } = require("mongoose");

const carChecklistSchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  checklist: { type: Object, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const CarChecklist = mongoose.model("CarChecklist", carChecklistSchema);

module.exports = { carChecklistSchema, CarChecklist };
