// controllers/userController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const bcrypt = require("bcrypt");
require("dotenv").config();

const listUsers = async (request, reply) => {
  const { page = 1, limit = 10, type } = request.query;
  const query = type ? { role: type } : {};
  try {
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
      .select("-password")
      .populate("car")
      .exec();
    return { users, page, limit };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getUser = async (request, reply) => {
  try {
    const user = await User.findOne({
      _id: request.params.id,
    })
      .select("-password -__v")
      .populate({
        path: "car",
        populate: [
          {
            path: "car_checklists",
            model: "CarChecklist",
            populate: {
              path: "user",
              model: "User",
              select: "first_name last_name _id",
            },
            options: {
              sort: { created_at: -1 },
            },
          },
          {
            path: "material_checklists",
            model: "MaterialChecklist",
            populate: {
              path: "user",
              model: "User",
              select: "first_name last_name _id",
            },
            options: {
              sort: { created_at: -1 },
            },
          },
        ],
      })
      .exec();
    return user;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateUser = async (request, reply) => {
  const {
    email,
    first_name,
    last_name,
    dob,
    phone,
    car,
    last_location,
    password,
    username
  } = request.body;
  const updates = {};

  // if some fields are missing, do not update them
  if (email) updates.email = email;
  if (first_name) updates.first_name = first_name;
  if (last_name) updates.last_name = last_name;
  if (dob) updates.dob = dob;
  if (username) updates.username = username;
  if (phone) updates.phone = phone;
  if (last_location) updates.last_location = last_location;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.password = hashedPassword;
  }
  if (car === "") {
    updates.car = null;
    const existingCar = await Car.findOne({ user: request.params.id });
    if (existingCar) {
      await Car.findOneAndUpdate(
        { _id: existingCar._id },
        { user: null },
        {
          returnDocument: "after",
        }
      );
    }
  } else if (car) {
    updates.car = car;
  }

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
    reply.code(500).send({ error: err });
  }
};

const userRoutes = () => {
  fastify.get("/api/users", { preHandler: [fastify.authenticate] }, listUsers);
  fastify.get(
    "/api/users/:id",
    { preHandler: [fastify.authenticate] },
    getUser
  );
  fastify.put(
    "/api/users/:id",
    { preHandler: [fastify.authenticate] },
    updateUser
  );
  fastify.delete(
    "/api/users/:id",
    { preHandler: [fastify.authenticate] },
    deleteUser
  );
};

module.exports = userRoutes;
