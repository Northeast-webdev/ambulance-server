// schema/user.schema.js
const { Schema, default: mongoose } = require("mongoose");

const patientSchema = new Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  runs: [{ type: Schema.Types.ObjectId, ref: "Run", default: [] }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const Patient = mongoose.model("Patient", patientSchema);

module.exports = { patientSchema, Patient };
