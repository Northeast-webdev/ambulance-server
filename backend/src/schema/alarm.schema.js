// schema/alarm.schema.js
const { Schema, default: mongoose } = require("mongoose");

const alarmSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  car: { type: Schema.Types.ObjectId, ref: "Car" },
  car_checklist_done: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});
const Alarm = mongoose.model("Alarm", alarmSchema);

module.exports = { alarmSchema, Alarm };
