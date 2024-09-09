// controllers/authController.js

const bcrypt = require("bcrypt");
const jwt = require("../jwt");
const { User } = require("../schema/user.schema");
const { fastify } = require("../init");

const register = async (request, reply) => {
  const { username, password, email, first_name, last_name, dob, phone } =
    request.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    }).exec();

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
    const user = await User.findOne({ username }).exec();
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

const authRoutes = () => {
  // Registration endpoint
  fastify.post("/register", register);
  // Login endpoint
  fastify.post("/login", login);
};

module.exports = authRoutes;
