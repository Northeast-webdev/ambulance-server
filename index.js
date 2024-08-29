const jwt = require("./src/jwt");
const { fastify } = require("./src/init");
const userRoutes = require("./src/controllers/user");

fastify.decorate("authenticate", jwt.verifyToken);

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

userRoutes();

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
