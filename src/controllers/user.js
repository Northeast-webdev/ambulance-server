const { fastify } = require("../init");
const bcrypt = require("bcrypt");
const jwt = require("../jwt");
const { default: mongoose } = require("mongoose");
require("dotenv").config();
const { userSchema, User } = require("../schema/user.schema");
const db = mongoose.connection;

const register = async (request, reply) => {
  const { username, password, email, first_name, last_name, dob, phone } =
    request.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return reply.code(400).send({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      email,
      first_name,
      last_name,
      dob,
      phone,
    });
    await user.save();

    reply.send({ message: "User registered successfully" });
  } catch (err) {
    reply.code(500).send(err);
  }
};

const login = async (request, reply) => {
  const { username, password } = request.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return reply.code(400).send({ error: "Invalid username or password" });
    }

    // Compare the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.code(400).send({ error: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.generateToken(user);
    reply.send({ token });
  } catch (err) {
    reply.code(500).send({ error: "Internal Server Error" });
  }
};

const createUser = async (request, reply) => {
  const { name, email } = request.body;

  try {
    const user = new User({ name, email });
    await user.save();
    reply.send(user); // MongoDB returns the inserted documents in `ops` array
  } catch (error) {
    reply.code(500).send(error);
  }
};

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

  try {
    const result = await db
      .collection("users")
      .findOneAndUpdate({ _id: request.params.id }, updates, {
        returnDocument: "after",
      });
    reply.send(result.value);
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
  // Registration endpoint
  fastify.post("/register", register);
  // Login endpoint
  fastify.post("/login", login);

  fastify.get("/users", { preHandler: [fastify.authenticate] }, listUsers);
  fastify.get("/users/:id", { preHandler: [fastify.authenticate] }, getUser);
  fastify.post("/users", { preHandler: [fastify.authenticate] }, createUser);
  fastify.put("/users/:id", { preHandler: [fastify.authenticate] }, updateUser);
  fastify.delete(
    "/users/:id",
    { preHandler: [fastify.authenticate] },
    deleteUser
  );
};

module.exports = userRoutes;
