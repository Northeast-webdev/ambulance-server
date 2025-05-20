const { verifyToken } = require("./src/jwt");
const {
  fastify,
  connectToDatabase,
  setupWebSockets,
  services,
} = require("./src/init");
const fastifyStatic = require("@fastify/static");
const { Car } = require("./src/schema/car.schema");
const { User } = require("./src/schema/user.schema");
const {
  initializeAllCarsInventory,
} = require("./src/init/initializeAllCarsInventory");
const {
  initializeMaterialChecklistItems,
} = require("./src/init/materialChecklistItems");
const { initializeCarChecklistItems } = require("./src/init/carChecklistItems");

// Import controllers - legacy controllers
const authController = require("./src/controllers/authController");
const runController = require("./src/controllers/runController");
const carChecklistController = require("./src/controllers/carChecklistController");
const materialChecklistController = require("./src/controllers/materialChecklistController");
const inventoryController = require("./src/controllers/inventoryController");
const shiftController = require("./src/controllers/shiftController");

// Import V2 controllers (using BaseController pattern)
const UserControllerV2 = require("./src/controllers/UserControllerV2");
const PatientControllerV2 = require("./src/controllers/PatientControllerV2");
const CarControllerV2 = require("./src/controllers/CarControllerV2");

// Get component logger
const logger = services.logger.child("Server");

const cleanUpInactiveUsers = async () => {
  try {
    // Calculate the timestamp for 2 hours ago
    const inactiveThreshold = new Date(
      Date.now() - 1 * 60 * 60 * 1000 - 55 * 60 * 1000
    );

    // Step 1: Find cars that have been inactive for 2 hours
    const inactiveCars = await Car.find({
      updated_at: { $lte: inactiveThreshold }, // Cars not updated in the last 2 hours
      status: { $ne: "garage", $ne: "scrapped" }, // Exclude cars already in the garage or scrapped
    });

    // Step 2: Update the status of inactive cars and set user to null
    for (const car of inactiveCars) {
      // Step 3: Find the user associated with the car and set their car attribute to null
      if (car.user) {
        const user = await User.findById(car.user);
        if (user) {
          user.car = null;
          await user.save();
        }
      }

      car.status = "garage";
      car.user = null;
      await car.save();
    }

    logger.info(`Cleaned up ${inactiveCars.length} inactive cars.`);
  } catch (error) {
    logger.error("Error cleaning up inactive users:", error);
  }
};

// Register cron jobs
fastify.register(require("fastify-cron"), {
  jobs: [
    {
      name: "cleanUpInactiveUsers",
      cronTime: "0 */2 * * *", // Every 2 hours
      onTick: async () => {
        await cleanUpInactiveUsers();
      },
      startWhenReady: true,
    },
  ],
});

// Serve static files from the frontend/dist folder
fastify.register(fastifyStatic, {
  root: require("path").join(__dirname, "../frontend/dist"),
  prefix: "/",
});

// Register the CORS plugin
fastify.register(require("@fastify/cors"), {
  origin: "*", // Allow all origins. Change this to the specific origin in production.
  allowedHeaders: ["Content-Type", "Authorization"], // Allow only these headers.
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow only these HTTP methods.
});

fastify.register(require("@fastify/websocket"), {
  options: {
    maxPayload: 1048576, // 1MB
    pingInterval: 30000,
  },
});

// Add health check endpoint for deployment environments
fastify.get("/health", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Add the authenticate decorator for jwt
fastify.decorate("authenticate", verifyToken);

// Set up WebSockets after plugins are registered
const setupRoutes = async () => {
  try {
    // Initialize WebSockets
    await setupWebSockets();

    // Register routes
    authController();
    runController();
    carChecklistController();
    materialChecklistController();
    inventoryController();
    shiftController();

    // Register V2 controllers (using BaseController pattern)
    UserControllerV2();
    CarControllerV2();
    PatientControllerV2();

    logger.info("Routes setup completed successfully");

    logger.info("Cron jobs started successfully");
  } catch (err) {
    logger.error("Error starting routes and cron jobs:", err);
    process.exit(1);
  }
};

// Start the server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({
      host: "0.0.0.0",
      port: port,
    });
    // Start all cron jobs
    fastify.cron.startAllJobs();
    logger.info(`Server is running on port ${port}`);
  } catch (err) {
    logger.error("Error starting server:", err);
    process.exit(1);
  }
};

// Main execution flow
async function main() {
  try {
    // Check if we're in local development
    const isLocalDev = process.env.NODE_ENV !== "production";
    console.log(`Running in ${isLocalDev ? "development" : "production"} mode`);

    // First connect to the database
    try {
      await connectToDatabase();

      // Only initialize database items if not in local development
      if (!isLocalDev) {
        try {
          // Initialize checklist items
          await initializeMaterialChecklistItems();
          await initializeCarChecklistItems();
          // Initialize inventory for all cars
          await initializeAllCarsInventory();
          logger.info("Database initialization completed successfully");
        } catch (error) {
          logger.error("Error initializing database:", error);
        }
      } else {
        logger.info("Skipping database initialization in development mode");
      }
    } catch (dbError) {
      logger.error(
        "Database connection failed, but continuing server startup:",
        dbError
      );
    }

    // Then set up routes and websockets
    await setupRoutes();

    // Finally start the server
    await start();
  } catch (err) {
    logger.error("Failed to start application:", err);
    process.exit(1);
  }
}

// Start the application
main();
