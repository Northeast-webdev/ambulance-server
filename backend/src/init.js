const Fastify = require("fastify");
const fastify = Fastify({ logger: process.env.NODE_ENV !== "production" });
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
const WebSocketService = require("./services/WebSocketService");

// MongoDB connection
const uri = process.env.MONGODB_URI;

// Initialize services
const services = {
  validation: new ValidationService(fastify),
  authorization: new AuthorizationService(),
  formatter: new FormatterService(),
  errorHandler: new ErrorHandlerService(),
  logger: new LoggingService(),
  websocket: null, // Will be initialized after fastify-websocket is registered
};

// Set up service dependencies
services.errorHandler.setFormatter(services.formatter);

async function connectToDatabase() {
  mongoose
    .connect(uri)
    .then(async () => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => console.error("Connection error", error));
}

async function setupWebSockets() {
  try {
    // Register WebSocket plugin
    await fastify.register(require("@fastify/websocket"), {
      options: {
        maxPayload: 1048576, // 1MB
        pingInterval: 30000,
      },
    });

    // Initialize WebSocket service
    services.websocket = new WebSocketService(fastify, {
      logger: services.logger.child("websocket"),
    });

    // Initialize WebSocket endpoints
    services.websocket.initialize();

    console.log("WebSocket service initialized");
  } catch (error) {
    console.error("Failed to initialize WebSocket service:", error);
  }
}

module.exports = { fastify, connectToDatabase, setupWebSockets, services };
