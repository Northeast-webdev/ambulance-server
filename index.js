const jwt = require("./src/jwt");
const { fastify, connectToDatabase } = require("./src/init");
const userRoutes = require("./src/controllers/userController");
const pdfRoutes = require("./src/controllers/pdfController");
const authRoutes = require("./src/controllers/authController");
const carRoutes = require("./src/controllers/carController");
const runRoutes = require("./src/controllers/runController");

fastify.decorate("authenticate", jwt.verifyToken); // Add the authenticate decorator for jwt
fastify.get("/", async () => {
  return { hello: "world" };
});

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
