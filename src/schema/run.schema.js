// schema/run.schema.js

const { Schema, default: mongoose } = require("mongoose");

const runSchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  title: { type: String, required: true },
  meta: { type: Object, required: true },
  status: { type: String, default: "draft" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Run = mongoose.model("Run", runSchema);

module.exports = { Run, runSchema };
