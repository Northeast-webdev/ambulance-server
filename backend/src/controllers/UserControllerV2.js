// controllers/UserControllerV2.js
// Implements user management using the base controller pattern

const BaseController = require("./base/BaseController");
const { User } = require("../schema/user.schema");
const { Car } = require("../schema/car.schema");
const bcrypt = require("bcrypt");
const ValidationService = require("../services/ValidationService");
const ErrorHandlerService = require("../services/ErrorHandlerService");
const FormatterService = require("../services/FormatterService");
const LoggingService = require("../services/LoggingService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("UserController");

class UserController extends BaseController {
  constructor() {
    // Pass model and options to base controller
    super(User, { modelName: "User" });

    // Override buildQuery for user-specific filtering
    this.buildQuery = this._buildUserQuery.bind(this);
  }

  /**
   * Custom query builder for user listing
   * @param {Object} request - Fastify request
   * @returns {Object} MongoDB query
   * @private
   */
  _buildUserQuery(request) {
    const query = {};
    const { type, search } = request.query;

    // Filter by user type/role
    if (type) {
      query.role = type;
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { first_name: searchRegex },
        { last_name: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
      ];
    }

    return query;
  }

  /**
   * Get user with related data
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} User with populated data
   */
  async getById(request, reply) {
    try {
      logger.debug(`Getting user by ID: ${request.params.id}`);

      const user = await User.findOne({ _id: request.params.id })
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
              options: { sort: { created_at: -1 } },
            },
            {
              path: "material_checklists",
              model: "MaterialChecklist",
              populate: {
                path: "user",
                model: "User",
                select: "first_name last_name _id",
              },
              options: { sort: { created_at: -1 } },
            },
          ],
        })
        .populate("alarms")
        .exec();

      if (!user) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "User not found",
          "User"
        );
      }

      return FormatterService.formatResponse(user);
    } catch (error) {
      logger.error("Error fetching user by ID", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Update a user
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Updated user
   */
  async update(request, reply) {
    try {
      logger.debug(`Updating user: ${request.params.id}`);

      const { id } = request.params;
      const {
        email,
        first_name,
        last_name,
        dob,
        phone,
        car,
        last_location,
        password,
        username,
        fcm_token,
      } = request.body;

      const updates = {};

      // Only update provided fields
      if (email) updates.email = email;
      if (first_name) updates.first_name = first_name;
      if (last_name) updates.last_name = last_name;
      if (dob) updates.dob = dob;
      if (username) updates.username = username;
      if (phone) updates.phone = phone;
      if (last_location) updates.last_location = last_location;
      if (fcm_token !== undefined) updates.fcm_token = fcm_token;

      // Hash password if provided
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      // Handle car assignment/removal
      if (car === "") {
        updates.car = null;
        const existingCar = await Car.findOne({ user: id });
        if (existingCar) {
          await Car.findOneAndUpdate(
            { _id: existingCar._id },
            { user: null },
            { returnDocument: "after" }
          );
        }
      } else if (car) {
        updates.car = car;
      }

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      // Update the user
      const result = await User.findOneAndUpdate({ _id: id }, updates, {
        returnDocument: "after",
      });

      if (!result) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "User not found",
          "User"
        );
      }

      return FormatterService.formatResponse(result, {
        message: "User updated successfully",
      });
    } catch (error) {
      logger.error("Error updating user", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Register routes for the user controller
   * @param {Object} fastify - Fastify instance
   */
  registerRoutes() {
    const routeOptions = { preHandler: [this.fastify.authenticate] };

    // Register standard routes via base controller
    super.registerRoutes("/api/users");

    // Add custom routes
    this.fastify.get(
      "/api/users/me",
      routeOptions,
      this.getCurrentUser.bind(this)
    );
    this.fastify.put(
      "/api/users/fcm-token",
      routeOptions,
      this.updateFCMToken.bind(this)
    );
  }

  /**
   * Get the current authenticated user
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Current user
   */
  async getCurrentUser(request, reply) {
    try {
      if (!request.user || !request.user._id) {
        return ErrorHandlerService.handleUnauthorized(reply);
      }

      const user = await User.findById(request.user._id)
        .select("-password -__v")
        .populate("car")
        .exec();

      if (!user) {
        return ErrorHandlerService.handleNotFound(
          reply,
          "User not found",
          "User"
        );
      }

      return FormatterService.formatResponse(user);
    } catch (error) {
      logger.error("Error getting current user", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }

  /**
   * Update user's FCM token for push notifications
   * @param {Object} request - Fastify request
   * @param {Object} reply - Fastify reply
   * @returns {Object} Success response
   */
  async updateFCMToken(request, reply) {
    try {
      const { fcm_token } = request.body;

      if (!fcm_token) {
        return ErrorHandlerService.handleBadRequest(
          reply,
          "FCM token is required"
        );
      }

      if (!request.user || !request.user._id) {
        return ErrorHandlerService.handleUnauthorized(reply);
      }

      await User.findByIdAndUpdate(request.user._id, {
        fcm_token,
        updated_at: new Date().toISOString(),
      });

      return FormatterService.formatResponse(null, {
        message: "FCM token updated successfully",
      });
    } catch (error) {
      logger.error("Error updating FCM token", error);
      return ErrorHandlerService.handleError(error, reply);
    }
  }
}

// Create singleton instance
const userController = new UserController();

// Export route registration function
module.exports = () => userController.registerRoutes();
