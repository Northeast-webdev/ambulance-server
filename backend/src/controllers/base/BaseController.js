// BaseController.js
// Implements the base controller pattern for standardizing CRUD operations

class BaseController {
  constructor(model, options = {}) {
    this.model = model;
    this.options = options;
    this.modelName = options.modelName || model.modelName;
    this.fastify = require("../../init").fastify;
  }

  /**
   * Standard GET all items handler
   */
  async getAll(request, reply) {
    try {
      const { page = 1, limit = 10, sort = "-created_at" } = request.query;
      const query = this.buildQuery ? this.buildQuery(request) : {};

      const items = await this.model
        .find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort(sort);

      const total = await this.model.countDocuments(query);

      return {
        data: items,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error(`[${this.modelName}] Error:`, error);
      return reply
        .code(500)
        .send({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Standard GET by ID handler
   */
  async getById(request, reply) {
    try {
      const { id } = request.params;
      const item = await this.model.findById(id);

      if (!item) {
        return reply.code(404).send({ error: `${this.modelName} not found` });
      }

      return item;
    } catch (error) {
      console.error(`[${this.modelName}] Error:`, error);
      return reply
        .code(500)
        .send({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Standard CREATE handler
   */
  async create(request, reply) {
    try {
      const newItem = new this.model(request.body);
      const savedItem = await newItem.save();
      return reply.code(201).send(savedItem);
    } catch (error) {
      console.error(`[${this.modelName}] Error:`, error);
      return reply
        .code(500)
        .send({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Standard UPDATE handler
   */
  async update(request, reply) {
    try {
      const { id } = request.params;

      // Add updated_at timestamp
      const updates = {
        ...request.body,
        updated_at: new Date().toISOString(),
      };

      const updatedItem = await this.model.findOneAndUpdate(
        { _id: id },
        updates,
        { new: true }
      );

      if (!updatedItem) {
        return reply.code(404).send({ error: `${this.modelName} not found` });
      }

      return updatedItem;
    } catch (error) {
      console.error(`[${this.modelName}] Error:`, error);
      return reply
        .code(500)
        .send({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Standard DELETE handler
   */
  async delete(request, reply) {
    try {
      const { id } = request.params;
      const result = await this.model.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: `${this.modelName} not found` });
      }

      return { message: `${this.modelName} deleted successfully` };
    } catch (error) {
      console.error(`[${this.modelName}] Error:`, error);
      return reply
        .code(500)
        .send({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Register routes for this controller
   */
  registerRoutes(basePath) {
    const path = basePath || `/api/${this.modelName.toLowerCase()}s`;
    const routeOptions = { preHandler: [this.fastify.authenticate] };

    // Register standard CRUD routes
    this.fastify.get(path, routeOptions, (req, reply) =>
      this.getAll(req, reply)
    );
    this.fastify.get(`${path}/:id`, routeOptions, (req, reply) =>
      this.getById(req, reply)
    );
    this.fastify.post(path, routeOptions, (req, reply) =>
      this.create(req, reply)
    );
    this.fastify.put(`${path}/:id`, routeOptions, (req, reply) =>
      this.update(req, reply)
    );
    this.fastify.delete(`${path}/:id`, routeOptions, (req, reply) =>
      this.delete(req, reply)
    );
  }
}

module.exports = BaseController;
