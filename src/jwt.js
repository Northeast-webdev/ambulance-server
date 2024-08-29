const jwt = require("jsonwebtoken");

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = { id: user.id, username: user.username };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const verifyToken = async (request, reply) => {
  try {
    const token = request.headers.authorization?.split(" ")[1]; // Extract token from header
    if (!token) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded; // Attach decoded user to the request
  } catch (err) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
};

module.exports = { generateToken, verifyToken };
