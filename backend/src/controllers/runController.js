// controllers/runController.js

const { fastify } = require("../init");
const { Car } = require("../schema/car.schema");
const { Patient } = require("../schema/patient.schema");
const { Run } = require("../schema/run.schema");
const { Alarm } = require("../schema/alarm.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
require("dotenv").config();
const admin = require("firebase-admin");
// Store WebSocket connections per user
const userConnections = new Map();

const serviceAccount = require("../cvsphub-firebase-adminsdk-jgvr0-510f6077d1.json");
const { User } = require("../schema/user.schema");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const zoneCenter = { lat: 44.42600757181744, lng: 8.850815866176998 }; // Example coordinates
const radiusInKm = 120 / 1000;

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
}

function isUserInZone(last_location) {
  const distance = calculateDistance(
    zoneCenter.lat,
    zoneCenter.lng,
    last_location.latitude,
    last_location.longitude
  );

  return distance <= radiusInKm;
}

const sendNotification = async (deviceToken, type, data) => {
  const message = {
    notification: {
      body:
        type === "new_run"
          ? data.programmed
            ? "Corsa programmata"
            : "Richiesta di guida in arrivo"
          : "La corsa seguente è stata annullata",
      title: `${data.patient.name} ${data.patient.surname}`,
    },
    android: {
      notification: {
        color: "#16a34a",
        sound:
          type === "new_run"
            ? data.programmed
              ? "program"
              : "alert"
            : "notification",
        channelId:
          type === "new_run"
            ? data.programmed
              ? "programmed_run"
              : "new_run"
            : "stop_run",
      },
      priority: "high",
    },
    token: deviceToken, // The FCM token of the target device
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const createRun = async (request, reply) => {
  const { additionalRuns, name, surname, phone, address } = request.body;
  try {
    const patient = await Patient.find({
      name: { $regex: name || "", $options: "i" },
      surname: { $regex: surname || "", $options: "i" },
    });
    let patID = patient.length ? patient[0]._id : "";
    if (!patient.length) {
      const newPatient = new Patient({ name, surname, phone, address });
      await newPatient.save();
      patID = newPatient._id;
    }
    if (additionalRuns && additionalRuns.length) {
      for await (const additionalRun of additionalRuns) {
        const newRun = new Run({
          meta: additionalRun.meta,
          status: "pending",
          geometry: additionalRun.geometry,
          end_geometry: additionalRun.end_geometry,
          patient: patID,
        });
        await newRun.save();
        await Patient.updateOne(
          { _id: patID },
          { $push: { runs: newRun._id } }
        );
      }
    }
    reply.send({
      message: "Successfully added " + additionalRuns.length + " runs",
    });
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
    meta_date,
    car,
    status,
    start_date,
    end_date,
  } = request.query;
  const q = {};
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    q.created_at = { $gte: startDate, $lte: endDate };
  }
  if (updated_date) {
    const startDate = new Date(updated_date);
    const endDate = new Date(updated_date);
    endDate.setDate(endDate.getDate() + 1);
    q.updated_at = { $gte: startDate, $lte: endDate };
  }
  if (meta_date) {
    q["meta.date"] = meta_date;
  }
  if (start_date && end_date) {
    q.updated_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date).setDate(new Date(end_date).getDate() + 1),
    };
  }
  if (patient) {
    q.patient = patient;
  }
  if (status && status !== "ACTIVE") {
    q.status = status;
  } else if (status === "ACTIVE") {
    q.status = { $ne: "completed" };
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
      .sort(meta_date ? { "meta.ora": 1 } : { created_at: -1 })
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
  const {
    car,
    user,
    meta,
    status,
    notification_sent,
    geometry,
    programmed,
    run_cancelled,
  } = request.body;
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
  if (programmed !== undefined) updates.programmed = programmed;
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
      .populate({
        path: "car",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .populate("patient");
    console.log("Status:", status);
    console.log("Car:", car);
    if ((!result.car || !car) && !run_cancelled) {
      reply.send({ run: result });
      return;
    }
    const existingCar = await Car.findOne({
      _id: run_cancelled ? run.car?._id.toString() : result.car._id.toString(),
    });
    console.log("Existing car:", existingCar);
    const assignedUserId = existingCar.user.toString();
    const assignedUser = await User.findOne({ _id: assignedUserId });
    const assignedUserToken = assignedUser.fcm_token;
    if (assignedUserToken) {
      await sendNotification(
        assignedUserToken,
        run_cancelled ? "stop_run" : "new_run",
        result
      );
    }
    // Send new run to the assigned user via WebSocket
    const assignedUserConnection = userConnections.get(assignedUserId);
    console.log("Assigned user connection:", typeof assignedUserConnection);
    if (assignedUserConnection) {
      assignedUserConnection.send(
        JSON.stringify({
          type: run_cancelled ? "stop_run" : "new_run",
          data: result,
        })
      );
      console.log(`Run sent to user ${assignedUserId}`);
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

  if (userConnections.has(userId)) {
    const existingConnection = userConnections.get(userId);
    existingConnection.close(); // Optionally close existing connection
  }
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
            "checkpoints.ongoing": new Date().toISOString(),
            notification_sent: true,
          },
          {
            returnDocument: "after",
          }
        );
        console.log("Run accepted:", x._id.toString());
        socket.send(
          JSON.stringify({
            type: "run_accepted",
            data: x._id.toString(),
          })
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
        // Implement location update logic here
        const car = await Car.findOne({
          _id: carID,
        }).populate("user");
        if (car.user) {
          const query = { _id: car.user._id };
          const update = {};
          if (latitude && longitude) {
            const isInZone = isUserInZone({
              latitude,
              longitude,
            });
            console.log("isInZone", isInZone);
            const recentAlarm = await Alarm.findOne({
              user: car.user._id,
              car: car._id,
              created_at: { $gte: car.shift_start },
            }).sort({ created_at: -1 }); // Get the most recent alarm
            console.log("recentAlarm", recentAlarm);
            if (!isInZone && !recentAlarm) {
              const car_checklist_done = await CarChecklist.exists({
                car: car._id,
                user: car.user._id,
                created_at: { $gte: car.shift_start },
              });
              console.log("car_checklist_done", car_checklist_done);
              const material_checklist_done = await MaterialChecklist.exists({
                car: car._id,
                user: car.user._id,
                created_at: { $gte: car.shift_start },
              });
              console.log("material_checklist_done", material_checklist_done);
              const alarm = new Alarm({
                user: car.user._id,
                car: car._id,
                car_checklist_done: !!car_checklist_done,
                material_checklist_done: !!material_checklist_done,
              });
              console.log("alarm", alarm);
              await alarm.save();
              update.alarms = [...(car.user.alarms || []), alarm._id];
            }
          }
          await User.updateOne(query, update);
        }
        if (car) {
          car.last_location = { latitude, longitude };
          await car.save();
        }
        break;
      default:
        break;
    }
  });

  // Handle connection close
  socket.on("close", () => {
    console.log(`User ${userId} disconnected`);
    userConnections.delete(userId); // Remove connection when closed
  });

  socket.on("error", (error) => {
    console.log("Error driver websocket", error);
    socket.close();
  });
};

const websocketWatcher = (socket, req) => {
  console.log("Client connected");

  // Create change stream to listen for changes in the collection
  const changeStream = Run.watch();

  changeStream.on("change", (change) => {
    // Broadcast the change event to the connected WebSocket client
    console.log("change for run: ", JSON.stringify(change));
    socket.send(JSON.stringify(change));
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    // Clean up change stream on disconnect
    changeStream.close();
  });

  socket.on("error", (error) => {
    console.log("Error admin websocket", error);
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

  fastify.register(async () => {
    fastify.get(
      "/api/runs/driver",
      {
        websocket: true,
        onTimeout: () => {
          console.log("Client timeout driver");
        },
        onError: (_socket, _req, error) => {
          console.log("Error driver", error);
        },
      },
      (socket, req) => {
        websocketHandler(socket, req);
      }
    );
    fastify.get(
      "/api/runs/admin",
      {
        websocket: true,
        onTimeout: () => {
          console.log("Client timeout admin");
        },
        onError: (_socket, _req, error) => {
          console.log("Error admin", error);
        },
      },
      (socket, req) => {
        websocketWatcher(socket, req);
      }
    );
  });
};

module.exports = runRoutes;
