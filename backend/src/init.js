const Fastify = require("fastify");
const fastify = Fastify({ logger: true });
const mongoose = require("mongoose");
require("dotenv").config();
const {
  initializeMaterialChecklistItems,
} = require("./init/materialChecklistItems");
const {
  initializeAllCarsInventory,
} = require("./init/initializeAllCarsInventory");

// Import services
const ValidationService = require("./services/ValidationService");
const AuthorizationService = require("./services/AuthorizationService");
const FormatterService = require("./services/FormatterService");
const ErrorHandlerService = require("./services/ErrorHandlerService");
const LoggingService = require("./services/LoggingService");

// MongoDB connection
const uri = process.env.MONGODB_URI;

// Initialize services
const services = {
  validation: new ValidationService(fastify),
  authorization: new AuthorizationService(),
  formatter: new FormatterService(),
  errorHandler: new ErrorHandlerService(),
  logger: new LoggingService(),
};

// Set up service dependencies
services.errorHandler.setFormatter(services.formatter);

async function connectToDatabase() {
  try {
    // Add connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      retryReads: true,
    };

    // Check if we're in local development or on Render
    const isLocalDev = process.env.NODE_ENV !== "production";

    if (isLocalDev) {
      console.log(
        "Local development detected - using alternate connection strategy"
      );
      // For local development where ISP may block MongoDB Atlas
      try {
        // You can add a mock DB connection for local dev or use a local MongoDB
        console.log("Local development - skipping MongoDB connection");
        return true;
      } catch (localError) {
        console.error("Local connection error", localError);
        return false;
      }
    } else {
      // Production environment - connect to MongoDB Atlas
      // Retry connection up to 3 times
      let retries = 3;
      while (retries > 0) {
        try {
          await mongoose.connect(uri, options);
          console.log("Connected to MongoDB");
          return true;
        } catch (innerError) {
          retries--;
          if (retries === 0) throw innerError;
          console.log(
            `Connection attempt failed. Retrying... (${retries} attempts left)`
          );
          // Wait 5 seconds between retries
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
  } catch (error) {
    console.error("Connection error", error);
    throw error;
  }
}

module.exports = { fastify, connectToDatabase, services };
