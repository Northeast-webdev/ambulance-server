/**
 * ValidationService.js
 * Service for schema validation using fastify's validation capabilities
 */

let _fastify = null;

class ValidationService {
  constructor(fastify) {
    // Store fastify instance for static methods to use
    _fastify = fastify;
  }

  /**
   * Validates request data against schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} - Validation result with isValid and errors
   */
  static validate(data, schema) {
    const result = { isValid: true, errors: null };

    try {
      if (!_fastify || !_fastify.ajv) {
        throw new Error("Fastify instance not initialized");
      }

      const validate = _fastify.ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        result.isValid = false;
        result.errors = validate.errors;
      }
    } catch (error) {
      result.isValid = false;
      result.errors = [{ message: error.message }];
    }

    return result;
  }

  /**
   * Creates a validation middleware for route handlers
   * @param {Object} schema - Schema to validate against
   * @returns {Function} - Middleware function
   */
  static createValidator(schema) {
    return (request, reply, done) => {
      const result = ValidationService.validate(request.body, schema);

      if (!result.isValid) {
        reply.code(400).send({
          error: "Validation Error",
          details: result.errors,
        });
        return;
      }

      done();
    };
  }
}

module.exports = ValidationService;
