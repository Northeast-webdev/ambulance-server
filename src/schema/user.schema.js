// schema/user.schema.js
const { Schema, default: mongoose } = require("mongoose");

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  dob: { type: Date, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: "driver" },
  driver_status: { type: String, default: "free" },
  car_id: { type: Number, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

module.exports = { userSchema, User };
