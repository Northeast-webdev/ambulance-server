const fastify = require("fastify")({ logger: true });

// Initialize the database connection
const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ambulance")
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => console.log(err));

module.exports = { fastify, mongoose };
