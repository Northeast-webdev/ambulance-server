const { pool, fastify } = require("../init");
const bcrypt = require("bcrypt");
const jwt = require("../jwt");

const register = async (request, reply) => {
  const { username, password, email, first_name, last_name, dob, phone } =
    request.body;
  const client = await pool.connect();

  try {
    // Check if user already exists
    const { rowCount } = await client.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (rowCount > 0) {
      return reply.code(400).send({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await client.query(
      "INSERT INTO users (username, password, email, first_name, last_name, dob, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [username, hashedPassword, email, first_name, last_name, dob, phone]
    );

    reply.send({ message: "User registered successfully" });
  } catch (err) {
    reply.code(500).send({ error: err });
  } finally {
    client.release();
  }
};

const login = async (request, reply) => {
  const { username, password } = request.body;
  const client = await pool.connect();

  try {
    // Check if user exists
    const { rows } = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (rows.length === 0) {
      return reply.code(400).send({ error: "Invalid username or password" });
    }

    const user = rows[0];

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
  } finally {
    client.release();
  }
};

const createUser = async (request, reply) => {
  const { name, email } = request.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    reply.send(result.rows[0]);
  } catch (error) {
    reply.code(500).send(error);
  } finally {
    client.release();
  }
};

const listUsers = async (request, reply) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT * FROM users");
    return rows;
  } finally {
    client.release();
  }
};

const getUser = async (request, reply) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT * FROM users WHERE id = $1", [
      request.params.id,
    ]);
    return rows[0];
  } finally {
    client.release();
  }
};

const updateUser = async (request, reply) => {
  const { email, first_name, last_name, dob, phone } = request.body;
  const client = await pool.connect();
  // if some fields are missing, do not update them
  try {
    let query = "UPDATE users SET ";
    let values = [];
    let index = 1;

    if (email) {
      query += `email = $${index}, `;
      values.push(email);
      index++;
    }

    if (first_name) {
      query += `first_name = $${index}, `;
      values.push(first_name);
      index++;
    }

    if (last_name) {
      query += `last_name = $${index}, `;
      values.push(last_name);
      index++;
    }

    if (dob) {
      query += `dob = $${index}, `;
      values.push(dob);
      index++;
    }

    if (phone) {
      query += `phone = $${index}, `;
      values.push(phone);
      index++;
    }

    // Remove the trailing comma and space
    query = query.slice(0, -2);

    query += ` WHERE id = $${index} RETURNING *`;
    console.log(query);
    values.push(request.params.id);

    const result = await client.query(query, values);
    reply.send(result.rows[0]);
  } catch (error) {
    reply.code(500).send(error);
  } finally {
    client.release();
  }
};

const deleteUser = async (request, reply) => {
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query("DELETE FROM users WHERE id = $1", [
      request.params.id,
    ]);
    if (rowCount === 0) {
      return reply.code(404).send({ error: "User not found" });
    }
    return { message: "User deleted successfully" };
  } finally {
    client.release();
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
