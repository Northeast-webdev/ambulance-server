const Fastify = require("fastify");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const fastify = Fastify();
// MongoDB connection setup
const uri = process.env.MONGODB_URI;
console.log(uri);
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
  },
});
let db;
console.log(db);
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("test");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

connectToDatabase();
module.exports = { fastify, db };
