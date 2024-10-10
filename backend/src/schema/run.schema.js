// schema/run.schema.js

const { Schema, default: mongoose } = require("mongoose");

const runSchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  meta: { type: Object, required: true, default: {} },
  geometry: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  notification_sent: { type: Boolean, default: false },
  patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  status: { type: String, default: "pending" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Run = mongoose.model("Run", runSchema);

module.exports = { Run, runSchema };
