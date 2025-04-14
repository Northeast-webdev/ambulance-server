// schema/car.schema.js
const { Schema, default: mongoose } = require("mongoose");

const carSchema = new Schema({
  meta: { type: Object, required: true },
  name: { type: String, required: true, default: "Car" },
  status: { type: String, default: "garage" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
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
  material_checklists: [
    { type: Schema.Types.ObjectId, ref: "MaterialChecklist" },
  ],
  car_checklists: [{ type: Schema.Types.ObjectId, ref: "CarChecklist" }],
  image: { type: String },
  shift_start: {
    type: Date,
    default: null,
  },
  shift_end: {
    type: Date,
    default: null,
  },
  crew: {
    driver: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      start_time: {
        type: Date,
        default: null,
      },
      end_time: {
        type: Date,
        default: null,
      },
    },
    doctor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      start_time: {
        type: Date,
        default: null,
      },
      end_time: {
        type: Date,
        default: null,
      },
    },
    nurse: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      start_time: {
        type: Date,
        default: null,
      },
      end_time: {
        type: Date,
        default: null,
      },
    },
  },
});
const Car = mongoose.model("Car", carSchema);

module.exports = { carSchema, Car };
