// controllers/PatientControllerV2.js
// Implements patient management using the base controller pattern

const BaseController = require("./base/BaseController");
const { Patient } = require("../schema/patient.schema");
const ValidationService = require("../services/ValidationService");
const ErrorHandlerService = require("../services/ErrorHandlerService");
const FormatterService = require("../services/FormatterService");
const LoggingService = require("../services/LoggingService");
const WebSocketService = require("../services/WebSocketService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("PatientController");

class PatientController extends BaseController {
  constructor() {
    // Pass model and options to base controller
    super(Patient, { modelName: "Patient" });

    // Override buildQuery for patient-specific filtering
    this.buildQuery = this._buildPatientQuery.bind(this);
  }

  /**
   * Custom query builder for patient listing
   * @param {Object} request - Fastify request
   * @returns {Object} MongoDB query
   * @private
   */
  _buildPatientQuery(request) {
    const query = {};
    const { surname, name, sortBySurname } = request.query;

    // Add search by name
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Add search by surname
    if (surname) {
      query.surname = { $regex: surname, $options: "i" };
    }

    return query;
  }

  /**
   * Get all patients with custom sorting
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} List of patients
   */
  async getAll(request, reply) {
    try {
      logger.debug("Getting all patients");

      const { page = 1, limit = 10, sortBySurname } = request.query;
      const query = this.buildQuery(request);
      const sort = sortBySurname ? { surname: 1 } : { created_at: -1 };

      const patients = await this.model
        .find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
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

      const total = await this.model.countDocuments(query);

      return FormatterService.formatResponse({
        patients,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error("Error fetching patients", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Get patient by ID with populated runs
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Patient with populated data
   */
  async getById(request, reply) {
    try {
      logger.debug(`Getting patient by ID: ${request.params.id}`);

      const patient = await Patient.findOne({
        _id: request.params.id,
      })
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
        .exec();

      if (!patient) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "Patient not found",
          "Patient"
        );
      }

      return FormatterService.formatResponse(patient);
    } catch (error) {
      logger.error("Error fetching patient by ID", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Get runs for a patient
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} List of runs for the patient
   */
  async getRunsForPatient(request, reply) {
    try {
      logger.debug(`Getting runs for patient: ${request.params.id}`);

      const patient = await Patient.findOne({
        _id: request.params.id,
      })
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
        .exec();

      if (!patient) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "Patient not found",
          "Patient"
        );
      }

      return FormatterService.formatResponse(patient.runs);
    } catch (error) {
      logger.error("Error fetching runs for patient", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Add a run to a patient
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Updated patient
   */
  async addRunToPatient(request, reply) {
    try {
      logger.debug(`Adding run to patient: ${request.params.id}`);

      const { id } = request.params;
      const { run } = request.body;

      if (!run) {
        return ErrorHandlerService.handleBadRequest(
          reply,
          "Run ID is required"
        );
      }

      const patient = await Patient.findOneAndUpdate(
        { _id: id },
        { $addToSet: { runs: run } },
        { new: true }
      ).exec();

      if (!patient) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "Patient not found",
          "Patient"
        );
      }

      // Publish update via WebSocket
      const wsService = this.fastify.websocketService;
      if (wsService) {
        wsService.publish("patients", {
          action: "run_added",
          patientId: id,
          runId: run,
        });
      }

      return FormatterService.formatResponse(patient, {
        message: "Run added to patient successfully",
      });
    } catch (error) {
      logger.error("Error adding run to patient", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Remove a run from a patient
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Updated patient
   */
  async removeRunFromPatient(request, reply) {
    try {
      logger.debug(`Removing run from patient: ${request.params.id}`);

      const { id } = request.params;
      const { run } = request.body;

      if (!run) {
        return ErrorHandlerService.handleBadRequest(
          reply,
          "Run ID is required"
        );
      }

      const patient = await Patient.findOneAndUpdate(
        { _id: id },
        { $pull: { runs: run } },
        { new: true }
      ).exec();

      if (!patient) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "Patient not found",
          "Patient"
        );
      }

      // Publish update via WebSocket
      const wsService = this.fastify.websocketService;
      if (wsService) {
        wsService.publish("patients", {
          action: "run_removed",
          patientId: id,
          runId: run,
        });
      }

      return FormatterService.formatResponse(patient, {
        message: "Run removed from patient successfully",
      });
    } catch (error) {
      logger.error("Error removing run from patient", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Register routes for the patient controller
   */
  registerRoutes() {
    const routeOptions = { preHandler: [this.fastify.authenticate] };

    // Register standard routes via base controller
    super.registerRoutes("/api/patients");

    // Add custom routes
    this.fastify.get(
      "/api/patients/:id/runs",
      routeOptions,
      this.getRunsForPatient.bind(this)
    );
    this.fastify.post(
      "/api/patients/:id/run",
      routeOptions,
      this.addRunToPatient.bind(this)
    );
    this.fastify.delete(
      "/api/patients/:id/run",
      routeOptions,
      this.removeRunFromPatient.bind(this)
    );
  }
}

// Create singleton instance
const patientController = new PatientController();

// Export route registration function
module.exports = () => patientController.registerRoutes();
