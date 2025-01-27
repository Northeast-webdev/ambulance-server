const Fastify = require("fastify");
const fastify = Fastify({ logger: process.env.NODE_ENV !== "production" });
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection
const uri = process.env.MONGODB_URI

async function connectToDatabase() {
  mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Connection error", error));
}

module.exports = { fastify, connectToDatabase };
