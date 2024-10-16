// controllers/runController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { Patient } = require("../schema/patient.schema");
const { Run } = require("../schema/run.schema");
require("dotenv").config();
// Store WebSocket connections per user
const userConnections = new Map();

const createRun = async (request, reply) => {
  const { meta, status, geometry, additionalRuns, patient: pat } = request.body;
  const run = new Run({
    meta,
    status,
    geometry,
  });
  try {
    const patient = await Patient.find({
      name: { $regex: pat || "", $options: "i" },
    });
    if (patient.length) {
      await Patient.updateOne(
        { _id: patient[0]._id },
        { $push: { runs: run._id } }
      );
      run.patient = patient[0]._id;
    } else {
      let words = pat.split(" ");

      for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1).toLowerCase();
      }
      const newPatient = new Patient({ name: words.join(" ") });
      await newPatient.save();
      await Patient.updateOne(
        { _id: newPatient._id },
        { $push: { runs: run._id } }
      );
      run.patient = newPatient._id;
    }
    await run.save();
    if (additionalRuns && additionalRuns.length) {
      for await (const additionalRun of additionalRuns) {
        const newRun = new Run({
          meta: additionalRun.meta,
          status: "pending",
          geometry: additionalRun.geometry,
          end_geometry: additionalRun.end_geometry,
          patient: run.patient,
        });
        await newRun.save();
        await Patient.updateOne(
          { _id: run.patient },
          { $push: { runs: newRun._id } }
        );
      }
    }
    reply.send({ run: run });
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const listRuns = async (request, reply) => {
  const {
    page = 1,
    limit = 100,
    patient,
    user,
    date,
    updated_date,
    car,
    status,
  } = request.query;
  const q = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    q.created_at = { $gte: startDate, $lt: endDate };
  }
  if (updated_date) {
    const startDate = new Date(updated_date);
    const endDate = new Date(updated_date);
    endDate.setDate(endDate.getDate() + 1);
    q.updated_at = { $gte: startDate, $lt: endDate };
  }
  if (patient) {
    q.patient = patient;
  }
  if (status) {
    q.status = status;
  }
  if (car) {
    q.car = car;
  }
  if (user) {
    q.user = user;
  }
  try {
    const runs = await Run.find({
      ...q,
    })
      .populate({
        path: "car",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .populate("patient")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 })
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
      .populate("patient")
      .exec();
    return run;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updateRun = async (request, reply) => {
  const { car, user, meta, status, notification_sent, geometry } = request.body;
  const updates = {};
  const run = await Run.findOne({ _id: request.params.id });
  // if some fields are missing, do not update them
  updates.checkpoints = run.checkpoints || {};
  if (car) updates.car = car;
  if (car === "") {
    updates.car = null;
  }
  if (user) updates.user = user;
  if (meta) updates.meta = meta;
  if (status) {
    updates.status = status;
    if (status === "completed") {
      updates.checkpoints.completed = new Date().toISOString();

      // Calculate the length of the run in seconds
      updates.length = Math.floor(
        (new Date(run.checkpoints.completed).getTime() -
          new Date(run.checkpoints.ongoing).getTime()) /
          1000
      );
    }
    if (status === "picked_up") {
      updates.checkpoints.picked_up = new Date().toISOString();
    }
    if (status === "ongoing") {
      updates.checkpoints.ongoing = new Date().toISOString();
    }
  }
  if (notification_sent) updates.notification_sent = notification_sent;
  if (geometry) updates.geometry = geometry;
  updates.updated_at = new Date().toISOString();

  try {
    await Run.updateOne({ _id: request.params.id }, updates, {
      returnDocument: "after",
    });
    const result = await Run.findOne({ _id: request.params.id })
      .populate("car")
      .populate("patient");
    console.log("Status:", status);
    console.log("Car:", car);
    if (!result.car || !car) {
      reply.send({ run: result });
      return;
    }
    const existingCar = await Car.findOne({ _id: result.car._id.toString() });
    if (existingCar && status === "ongoing") {
      await Car.findOneAndUpdate(
        { _id: existingCar._id.toString() },
        { status: "busy" },
        {
          returnDocument: "after",
        }
      );
    }
    console.log("Existing car:", existingCar);
    const assignedUserId = existingCar.user.toString();

    // Send new run to the assigned user via WebSocket
    const assignedUserConnection = userConnections.get(assignedUserId);
    console.log("Assigned user connection:", typeof assignedUserConnection);
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
    console.error(error);
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
        const x = await Run.findOneAndUpdate(
          { _id: data.run_id },
          {
            status: "ongoing",
            notification_sent: true,
          },
          {
            returnDocument: "after",
          }
        );
        await Car.findOneAndUpdate(
          { _id: x.car.toString() },
          {
            status: "busy",
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
            status: "refused",
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
    console.log("change for run");
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
