/**
 * ErrorHandlerService.js
 * Service for standardized error handling and responses
 */

const errorMap = {
  ValidationError: 400,
  AuthorizationError: 403,
  AuthenticationError: 401,
  NotFoundError: 404,
  ConflictError: 409,
  RateLimitError: 429,
};

// Instance for internal use
let formatter = null;

class ErrorHandlerService {
  constructor(formatterService) {
    if (formatterService) {
      formatter = formatterService;
    }
  }

  /**
   * Set formatter service for response formatting
   * @param {Object} formatterService - FormatterService instance
   */
  setFormatter(formatterService) {
    formatter = formatterService;
  }

  /**
   * Handle error and send appropriate response
   * @param {Error} error - Error object
   * @param {Object} reply - Fastify reply object
   * @returns {Object} - Formatted error response
   */
  static handleError(error, reply) {
    const errorName = error.name || "Error";
    const statusCode = errorMap[errorName] || 500;

    console.error(`[ErrorHandler] ${errorName}: ${error.message}`, error.stack);

    const response = formatter
      ? formatter.formatError(error, statusCode, error.details)
      : {
          error: error.message,
          statusCode,
          details: error.details,
        };

    if (reply) {
      return reply.code(statusCode).send(response);
    }

    return response;
  }

  /**
   * Handle not found errors
   * @param {Object} reply - Fastify reply object
   * @param {String} message - Custom message
   * @returns {Object} - Not found error response
   */
  static handleNotFound(reply, message = "Resource not found") {
    const error = new Error(message);
    error.name = "NotFoundError";
    return ErrorHandlerService.handleError(error, reply);
  }

  /**
   * Handle validation errors
   * @param {Object} reply - Fastify reply object
   * @param {Array|String} details - Validation error details
   * @returns {Object} - Validation error response
   */
  static handleValidationError(reply, details) {
    const error = new Error("Validation failed");
    error.name = "ValidationError";
    error.details = details;
    return ErrorHandlerService.handleError(error, reply);
  }

  /**
   * Handle authentication errors
   * @param {Object} reply - Fastify reply object
   * @param {String} message - Custom message
   * @returns {Object} - Authentication error response
   */
  static handleAuthError(reply, message = "Authentication required") {
    const error = new Error(message);
    error.name = "AuthenticationError";
    return ErrorHandlerService.handleError(error, reply);
  }

  /**
   * Handle bad request errors
   * @param {Object} reply - Fastify reply object
   * @param {String} message - Custom message
   * @returns {Object} - Bad request error response
   */
  static handleBadRequest(reply, message = "Bad request") {
    const error = new Error(message);
    error.name = "ValidationError";
    return ErrorHandlerService.handleError(error, reply);
  }
}

module.exports = ErrorHandlerService;
