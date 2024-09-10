// schema/car.schema.js
const { Schema, default: mongoose } = require("mongoose");

const carSchema = new Schema({
  meta: { type: Object, required: true },
  name: { type: String, required: true },
  status: { type: String, default: "draft" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const Car = mongoose.model("Car", carSchema);

module.exports = { carSchema, Car };
