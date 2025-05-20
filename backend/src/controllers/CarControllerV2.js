// controllers/CarControllerV2.js
// Implements car management using the base controller pattern

const BaseController = require("./base/BaseController");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const { Run } = require("../schema/run.schema");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const InventoryService = require("../services/InventoryService");
const ValidationService = require("../services/ValidationService");
const ErrorHandlerService = require("../services/ErrorHandlerService");
const FormatterService = require("../services/FormatterService");
const LoggingService = require("../services/LoggingService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("CarController");

class CarController extends BaseController {
  constructor() {
    // Pass model and options to base controller
    super(Car, { modelName: "Car" });

    // Override buildQuery for car-specific filtering
    this.buildQuery = this._buildCarQuery.bind(this);
  }

  /**
   * Custom query builder for car listing
   * @param {Object} request - Fastify request
   * @returns {Object} MongoDB query
   * @private
   */
  _buildCarQuery(request) {
    const query = {};
    const { status, name } = request.query;

    // Filter by car status
    if (status) {
      query.status = status;
    }

    // Filter by name
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    return query;
  }

  /**
   * Get all cars with pagination and sorting
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} List of cars
   */
  async getAll(request, reply) {
    try {
      logger.debug("Getting all cars");

      const { page = 1, limit = 20 } = request.query;
      const query = this.buildQuery(request);

      const cars = await this.model
        .find(query)
        .populate("user", "first_name last_name _id")
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ name: 1 })
        .exec();

      const total = await this.model.countDocuments(query);

      return FormatterService.formatResponse({
        cars,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error("Error fetching cars", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Create a new car
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Created car
   */
  async create(request, reply) {
    try {
      logger.debug("Creating new car");

      const { meta, name, image, old_car_id } = request.body;

      // Validate required fields
      if (!meta) {
        return ErrorHandlerService.handleBadRequest(
          reply,
          "Meta information is required"
        );
      }

      // Create car with default damages structure
      const car = new Car({
        meta,
        name,
        damages: {
          front: [],
          back: [],
          left: [],
          right: [],
        },
        image,
      });

      await car.save();

      // Initialize inventory for the new car
      try {
        await InventoryService.initializeCarInventory(car._id);
        logger.debug(`Initialized inventory for car ${car._id}`);
      } catch (inventoryError) {
        logger.error(
          `Error initializing inventory for car ${car._id}`,
          inventoryError
        );
        // Continue execution even if inventory initialization fails
      }

      // Handle old car replacement if specified
      if (old_car_id) {
        await Car.updateOne(
          { _id: old_car_id },
          { $set: { status: "scrapped", user: null } }
        );
        await User.updateOne({ car: old_car_id }, { $set: { car: null } });
        await Run.updateMany(
          { car: old_car_id, status: "pending" },
          { $set: { car: car._id } }
        );

        logger.info(`Replaced old car ${old_car_id} with new car ${car._id}`);
      }

      // Publish update via WebSocket
      const wsService = this.fastify.websocketService;
      if (wsService) {
        wsService.publish("cars", {
          action: "created",
          carId: car._id,
        });
      }

      return reply.code(201).send(
        FormatterService.formatResponse(car, {
          message: "Car created successfully",
        })
      );
    } catch (error) {
      logger.error("Error creating car", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Update a car
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Updated car
   */
  async update(request, reply) {
    try {
      logger.debug(`Updating car: ${request.params.id}`);

      const { id } = request.params;
      const {
        meta,
        status,
        user,
        last_location,
        shift_start,
        name,
        damages,
        image,
      } = request.body;

      // Check if user is already assigned to another car
      if (user && user !== null) {
        const carWithUser = await Car.findOne({ user });
        if (carWithUser && carWithUser._id.toString() !== id) {
          return ErrorHandlerService.handleBadRequest(
            reply,
            "This user has already been assigned to another car"
          );
        }
      }

      // Build update object with only provided fields
      const updates = {};
      if (meta) updates.meta = meta;
      if (status) updates.status = status;
      if (user !== undefined) updates.user = user;
      if (last_location) updates.last_location = last_location;
      if (shift_start !== undefined) updates.shift_start = shift_start;
      if (name) updates.name = name;
      if (damages) updates.damages = damages;
      if (image) updates.image = image;
      updates.updated_at = new Date().toISOString();

      // Update the car
      const result = await Car.findOneAndUpdate({ _id: id }, updates, {
        returnDocument: "after",
      });

      if (!result) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "Car not found",
          "Car"
        );
      }

      // Update user's car reference if user was assigned
      if (user && user !== null) {
        await User.findOneAndUpdate({ _id: user }, { car: result._id });
        logger.debug(`Updated user ${user} with car ${result._id}`);
      }

      // If user was removed from car, clear their car reference
      if (user === null) {
        const oldUser = await User.findOne({ car: id });
        if (oldUser) {
          await User.updateOne({ _id: oldUser._id }, { $set: { car: null } });
          logger.debug(`Removed car reference from user ${oldUser._id}`);
        }
      }

      // Publish update via WebSocket
      const wsService = this.fastify.websocketService;
      if (wsService) {
        wsService.publish("cars", {
          action: "updated",
          carId: id,
        });
      }

      return FormatterService.formatResponse(result, {
        message: "Car updated successfully",
      });
    } catch (error) {
      logger.error("Error updating car", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Delete a car
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Success response
   */
  async delete(request, reply) {
    try {
      logger.debug(`Deleting car: ${request.params.id}`);

      const { id } = request.params;

      // Remove car reference from any users
      await User.updateMany({ car: id }, { $set: { car: null } });

      // Delete the car
      const result = await Car.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "Car not found",
          "Car"
        );
      }

      // Publish delete via WebSocket
      const wsService = this.fastify.websocketService;
      if (wsService) {
        wsService.publish("cars", {
          action: "deleted",
          carId: id,
        });
      }

      return FormatterService.formatResponse(null, {
        message: "Car deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting car", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Get checklists for a car
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Car checklists
   */
  async getChecklistsForCar(request, reply) {
    try {
      logger.debug(`Getting checklists for car: ${request.params.id}`);

      const { id } = request.params;

      const car_checklists = await CarChecklist.find({ car: id })
        .populate("user", "first_name last_name _id")
        .exec();

      const material_checklists = await MaterialChecklist.find({ car: id })
        .populate("user", "first_name last_name _id")
        .exec();

      return FormatterService.formatResponse({
        car_checklists,
        material_checklists,
      });
    } catch (error) {
      logger.error("Error fetching car checklists", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Register routes for the car controller
   */
  registerRoutes() {
    const routeOptions = { preHandler: [this.fastify.authenticate] };

    // Register standard routes via base controller
    super.registerRoutes("/api/cars");

    // Add custom routes
    this.fastify.get(
      "/api/cars/:id/checklists",
      routeOptions,
      this.getChecklistsForCar.bind(this)
    );

    // Setup WebSocket change stream for cars
    if (this.fastify.websocketService) {
      // Listen for car changes and broadcast to subscribed clients
      const changeStream = Car.watch();

      changeStream.on("change", (change) => {
        // Extract relevant information and publish to websocket topic
        const wsService = this.fastify.websocketService;
        wsService.publish("cars", {
          action: "change",
          operationType: change.operationType,
          documentId: change.documentKey._id,
          changeData: change,
        });
      });

      // Store change stream for cleanup
      this.changeStream = changeStream;

      logger.info("Car change stream initialized for WebSocket broadcasting");
    }
  }
}

// Create singleton instance
const carController = new CarController();

// Export route registration function
module.exports = () => carController.registerRoutes();
