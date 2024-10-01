// controllers/runController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { Run } = require("../schema/run.schema");
const { User } = require("../schema/user.schema");
require("dotenv").config();
// Store WebSocket connections per user
const userConnections = new Map();

const createRun = async (request, reply) => {
  const { meta, status, geometry } = request.body;
  const run = new Run({
    meta,
    status,
    geometry,
  });
  try {
    await run.save();
    reply.send({ run: run });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const listRuns = async (request, reply) => {
  const { page = 1, limit = 10, query, date } = request.query;
  const q = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    q.created_at = { $gte: startDate, $lt: endDate };
  }
  try {
    const runs = await Run.find({
      ...query,
      ...q,
    })
      .populate({
        path: "car",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: 1 })
      .exec();
    return { runs, page, limit };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getRun = async (request, reply) => {
  try {
    const run = await Run.findOne({
      _id: request.params.id,
    })
      .populate("car")
      .exec();
    return run;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateRun = async (request, reply) => {
  const { car, title, meta, status, notification_sent, geometry } =
    request.body;
  const updates = {};

  // if some fields are missing, do not update them
  if (car) updates.car = car;
  if (car === "") {
    updates.car = null;
  }
  if (title) updates.title = title;
  if (meta) updates.meta = meta;
  if (status) updates.status = status;
  if (notification_sent) updates.notification_sent = notification_sent;
  if (geometry) updates.geometry = geometry;
  updates.updated_at = new Date().toISOString();

  try {
    const result = await Run.findOneAndUpdate(
      { _id: request.params.id },
      updates,
      {
        returnDocument: "before",
      }
    );
    const existingCar = await Car.findOne({ _id: result.car });
    if (existingCar && status !== "completed" && result.status !== "pending") {
      await Car.findOneAndUpdate(
        { _id: existingCar._id.toString() },
        { status: "busy" },
        {
          returnDocument: "after",
        }
      );
    }
    console.log("Existing car:", existingCar);
    console.log("Status:", status);
    if ((existingCar && status === "completed") || updates.car === null) {
      await Car.findOneAndUpdate(
        { _id: existingCar._id.toString() },
        { status: "free" },
        {
          returnDocument: "after",
        }
      );
    }
    if (!result.car || !car) {
      return reply.send({ run: result });
    }
    const assignedUserId = existingCar.user.toString();

    // Send new run to the assigned user via WebSocket
    const assignedUserConnection = userConnections.get(assignedUserId);
    console.log("Assigned user connection:", assignedUserConnection);
    if (assignedUserConnection) {
      assignedUserConnection.send(
        JSON.stringify({
          type: "new_run",
          data: result,
        })
      );
      console.log(`New run sent to user ${assignedUserId}`);
    }
    reply.send({ run: result });
  } catch (error) {
    reply.code(500).send(error);
  }
};

const deleteRun = async (request, reply) => {
  try {
    const result = await Run.deleteOne({
      _id: request.params.id,
    });
    if (result.deletedCount === 0) {
      return reply.code(404).send({ error: "Run not found" });
    }
    reply.send({ message: "Run deleted successfully" });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const websocketHandler = (socket, req) => {
  // Example: Parse user ID from query or authentication headers
  const userId = req.query.userId;
  console.log("User ID:", userId);

  if (!userId) {
    socket.send(
      JSON.stringify({
        error: "Unauthorized",
      })
    );
    socket.close();
    return;
  }

  // Store connection mapped by userId
  userConnections.set(userId, socket);

  console.log(`User ${userId} connected`);

  socket.on("message", async (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case "ping":
        socket.send(
          JSON.stringify({
            type: "pong",
            data: "pong",
          })
        );
        break;
      case "accept_run":
        // Implement run acceptance logic here
        await Run.findOneAndUpdate(
          { _id: data.run_id },
          {
            status: "ongoing",
            notification_sent: true,
          },
          {
            returnDocument: "after",
          }
        );
        break;
      case "refuse_run":
        await Run.findOneAndUpdate(
          { _id: data.run_id },
          {
            notification_sent: true,
            car: null,
          },
          {
            returnDocument: "after",
          }
        );
        break;
      case "location_update":
        const { carID, latitude, longitude } = data.data;
        console.log(
          `Location update from car ${carID}: ${latitude}, ${longitude}`
        );
        // Implement location update logic here
        const car = await Car.findOne({
          _id: carID,
        });
        if (car) {
          car.last_location = { latitude, longitude };
          await car.save();
        }

        break;
      default:
        break;
    }
    console.log("Received message:", data);
  });

  // Handle connection close
  socket.on("close", () => {
    console.log(`User ${userId} disconnected`);
    userConnections.delete(userId); // Remove connection when closed
  });
};

const websocketWatcher = (socket, req) => {
  console.log("Client connected");

  // Create change stream to listen for changes in the collection
  const changeStream = Run.watch();

  changeStream.on("change", (change) => {
    // Broadcast the change event to the connected WebSocket client
    socket.send(JSON.stringify(change));
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    // Clean up change stream on disconnect
    changeStream.close();
  });
};

const runRoutes = () => {
  fastify.post("/api/runs", { preHandler: [fastify.authenticate] }, createRun);
  fastify.get("/api/runs", { preHandler: [fastify.authenticate] }, listRuns);
  fastify.get("/api/runs/:id", { preHandler: [fastify.authenticate] }, getRun);
  fastify.put(
    "/api/runs/:id",
    { preHandler: [fastify.authenticate] },
    updateRun
  );
  fastify.delete(
    "/api/runs/:id",
    { preHandler: [fastify.authenticate] },
    deleteRun
  );

  fastify.register(async (fastify) => {
    fastify.get("/api/runs/driver", { websocket: true }, (socket, req) => {
      websocketHandler(socket, req);
    });
    fastify.get("/api/runs/admin", { websocket: true }, (socket, req) => {
      websocketWatcher(socket, req);
    });
  });
};

module.exports = runRoutes;
