// controllers/userController.js

const { fastify } = require("../init");
const { User } = require("../schema/user.schema");
require("dotenv").config();

const listUsers = async (request, reply) => {
  const { page = 1, limit = 10 } = request.query;
  try {
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
      .select("first_name last_name username role created_at updated_at")
      .exec();
    return { users, page, limit };
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const getUser = async (request, reply) => {
  try {
    const user = await User.findOne({
      _id: request.params.id,
    })
      .select("-password")
      .exec();
    return user;
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const updateUser = async (request, reply) => {
  const { email, first_name, last_name, dob, phone } = request.body;
  const updates = {};

  // if some fields are missing, do not update them
  if (email) updates.email = email;
  if (first_name) updates.first_name = first_name;
  if (last_name) updates.last_name = last_name;
  if (dob) updates.dob = dob;
  if (phone) updates.phone = phone;

  updates.updated_at = new Date().toISOString();

  try {
    const result = await User.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      {
        returnDocument: "after",
      }
    );
    reply.send(result);
  } catch (error) {
    reply.code(500).send(error);
  }
};

const deleteUser = async (request, reply) => {
  try {
    const result = await User.deleteOne({
      _id: request.params.id,
    });
    if (result.deletedCount === 0) {
      return reply.code(404).send({ error: "User not found" });
    }
    return { message: "User deleted successfully" };
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const userRoutes = () => {
  fastify.get("/users", { preHandler: [fastify.authenticate] }, listUsers);
  fastify.get("/users/:id", { preHandler: [fastify.authenticate] }, getUser);
  fastify.put("/users/:id", { preHandler: [fastify.authenticate] }, updateUser);
  fastify.delete(
    "/users/:id",
    { preHandler: [fastify.authenticate] },
    deleteUser
  );
};

module.exports = userRoutes;
