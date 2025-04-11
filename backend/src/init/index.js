const fastify = require("fastify")({ logger: true });
const {
  initializeMaterialChecklistItems,
} = require("./materialChecklistItems");

// Initialize the database connection
const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ambulance")
  .then(() => {
    console.log("MongoDB connected successfully");
    // Initialize material checklist items after database connection
    initializeMaterialChecklistItems();
  })
  .catch((err) => console.log(err));

module.exports = { fastify, mongoose };
