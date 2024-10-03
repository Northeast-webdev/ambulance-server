// schema/car.schema.js
const { Schema, default: mongoose } = require("mongoose");

const carSchema = new Schema({
  meta: { type: Object, required: true },
  name: { type: String, required: true, unique: true, default: "Car" },
  status: { type: String, default: "free" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  shift_start: { type: Date, default: Date.now },
  runs: [{ type: Schema.Types.ObjectId, ref: "Run", default: [] }],
  last_location: {
    latitude: { type: Number, default: 44.42580512807064 },
    longitude: { type: Number, default: 8.850582457670813 },
  },
  damages: {
    type: Object,
    required: true,
    default: {
      front: [],
      back: [],
      left: [],
      right: [],
    },
  },
});
const Car = mongoose.model("Car", carSchema);

module.exports = { carSchema, Car };
