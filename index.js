const jwt = require("./src/jwt");
const { fastify } = require("./src/init");
const userRoutes = require("./src/controllers/user");
const pdfRoutes = require("./src/controllers/pdf");
const { default: mongoose } = require("mongoose");
// MongoDB connection setup
const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
  mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Connection error", error));
}

connectToDatabase();

fastify.decorate("authenticate", jwt.verifyToken);
fastify.get("/", async () => {
  return { hello: "world" };
});

userRoutes();
pdfRoutes();
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" }); // Ensure it's listening on 0.0.0.0
    console.log("Server is running on port 8080");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
