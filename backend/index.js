const { verifyToken } = require("./src/jwt");
const { fastify, connectToDatabase } = require("./src/init");
const userRoutes = require("./src/controllers/userController");
const authRoutes = require("./src/controllers/authController");
const carRoutes = require("./src/controllers/carController");
const runRoutes = require("./src/controllers/runController");
const fastifyStatic = require("@fastify/static");
const carChecklistRoutes = require("./src/controllers/carChecklistController");
const materialChecklistRoutes = require("./src/controllers/materialChecklistController");
const patientRoutes = require("./src/controllers/patientController");
const { Car } = require("./src/schema/car.schema");
const { User } = require("./src/schema/user.schema");

const cleanUpInactiveUsers = async () => {
  try {
    // Calculate the timestamp for 2 hours ago
    const inactiveThreshold = new Date(
      Date.now() - 1 * 60 * 60 * 1000 - 55 * 60 * 1000
    );

    // Step 1: Find cars that have been inactive for 2 hours
    const inactiveCars = await Car.find({
      updated_at: { $lte: inactiveThreshold }, // Cars not updated in the last 2 hours
      status: { $ne: "garage" }, // Exclude cars already in the garage
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

    console.log(`Cleaned up ${inactiveCars.length} inactive cars.`);
  } catch (error) {
    console.error("Error cleaning up inactive users:", error);
  }
};

fastify.register(require("@fastify/websocket"));
fastify.register(require("fastify-cron"), {
  jobs: [
    {
      name: "cleanUpInactiveUsers",
      cronTime: "*/5 * * * *", // Every 5m
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

fastify.decorate("authenticate", verifyToken); // Add the authenticate decorator for jwt

// Connect to MongoDB
connectToDatabase();

// Register routes
authRoutes();
userRoutes();
carRoutes();
runRoutes();
carChecklistRoutes();
materialChecklistRoutes();
patientRoutes();

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    fastify.cron.startAllJobs();
    console.log("Server is running on port 8080");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
