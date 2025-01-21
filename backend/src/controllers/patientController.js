// controllers/patientController.js

const { fastify } = require("../init");
const { Patient } = require("../schema/patient.schema");

const createPatient = async (request, reply) => {
  const { name, surname, phone, address } = request.body;
  const patient = new Patient({ name, surname, phone, address });
  try {
    await patient.save();
    reply.send(patient);
  } catch (err) {
    console.log(err);
    reply.code(500).send({ error: err });
  }
};

const listPatients = async (request, reply) => {
  const { page = 1, limit = 10, surname, name, sortBySurname } = request.query;
  const query = {};
  const sort = sortBySurname ? { surname: 1 } : { created_at: -1 };
  if (surname) {
    query.surname = { $regex: surname || "", $options: "i" };
  }
  if (name) {
    query.name = { $regex: name || "", $options: "i" };
  }
  try {
    const patients = await Patient.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "runs",
        populate: {
          path: "car",
          populate: {
            path: "user",
            model: "User",
          },
        },
      })
      .sort(sort)
      .exec();
    return { patients, page, limit };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getPatient = async (request, reply) => {
  try {
    const patient = await Patient.findOne({
      _id: request.params.id,
    }).exec();
    return patient;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const updatePatient = async (request, reply) => {
  const { name, surname, phone, address, geometry } = request.body;
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: request.params.id },
      { name, surname, phone, address, geometry },
      { new: true }
    ).exec();
    return patient;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const deletePatient = async (request, reply) => {
  try {
    await Patient.deleteOne({ _id: request.params.id }).exec();
    return { message: "Patient deleted" };
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const getRunsForPatient = async (request, reply) => {
  const { id } = request.params;
  try {
    const patient = await Patient.findOne({ _id: id }).populate("runs").exec();
    return patient.runs;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const addRunToPatient = async (request, reply) => {
  const { id } = request.params;
  const { run } = request.body;
  try {
    const patient = Patient.updateOne({ _id: id }, { $push: { runs: run } });
    return patient;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const removeRunFromPatient = async (request, reply) => {
  const { id } = request.params;
  const { run } = request.body;
  try {
    const patient = Patient.updateOne({ _id: id }, { $pull: { runs: run } });
    return patient;
  } catch (err) {
    reply.code(500).send({ error: err });
  }
};

const patientRoutes = () => {
  fastify.post("/api/patient", createPatient);
  fastify.get("/api/patient", listPatients);
  fastify.get("/api/patient/:id", getPatient);
  fastify.put("/api/patient/:id", updatePatient);
  fastify.delete("/api/patient/:id", deletePatient);
  fastify.get("/api/patient/:id/runs", getRunsForPatient);
  fastify.post("/api/patient/:id/run", addRunToPatient);
  fastify.delete("/api/patient/:id/run", removeRunFromPatient);
};

module.exports = patientRoutes;
