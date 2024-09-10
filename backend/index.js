const { verifyToken } = require("./src/jwt");
const { fastify, connectToDatabase } = require("./src/init");
const userRoutes = require("./src/controllers/userController");
const pdfRoutes = require("./src/controllers/pdfController");
const authRoutes = require("./src/controllers/authController");
const carRoutes = require("./src/controllers/carController");
const runRoutes = require("./src/controllers/runController");
const fastifyStatic = require("@fastify/static");

// Serve static files from the frontend/dist folder
fastify.register(fastifyStatic, {
  root: require("path").join(__dirname, "../frontend/dist"),
  prefix: "/",
});
fastify.decorate("authenticate", verifyToken); // Add the authenticate decorator for jwt

// Connect to MongoDB
connectToDatabase();

// Register routes
authRoutes();
userRoutes();
pdfRoutes();
carRoutes();
runRoutes();

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    console.log("Server is running on port 8080");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
