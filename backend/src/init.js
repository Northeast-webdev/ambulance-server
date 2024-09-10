const Fastify = require("fastify");
const fastify = Fastify({ logger: true });
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection
const uri =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI
    : "mongodb://localhost:27017/ambulance";

async function connectToDatabase() {
  mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Connection error", error));
}

module.exports = { fastify, connectToDatabase };
