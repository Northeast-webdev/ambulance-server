// controllers/authController.js

const bcrypt = require("bcrypt");
const { generateToken } = require("../jwt");
const { User } = require("../schema/user.schema");
const { fastify } = require("../init");

const register = async (request, reply) => {
  const { username, password, email, first_name, last_name, dob, phone, role } =
    request.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    }).exec();

    if (existingUser) {
      const field = existingUser.username === username ? "username" : "email";
      return reply
        .code(400)
        .send({ error: `User with this ${field} already exists` });
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
      role,
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
    const token = generateToken(user);
    reply.send({ token, id: user._id });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const authRoutes = () => {
  // Registration endpoint
  fastify.post("/api/register", register);
  // Login endpoint
  fastify.post("/api/login", login);
};

module.exports = authRoutes;
