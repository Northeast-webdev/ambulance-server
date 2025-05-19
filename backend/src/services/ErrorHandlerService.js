/**
 * ErrorHandlerService.js
 * Service for standardized error handling and responses
 */

class ErrorHandlerService {
  constructor(formatter) {
    this.formatter = formatter || null;
    this.errorMap = {
      ValidationError: 400,
      AuthorizationError: 403,
      AuthenticationError: 401,
      NotFoundError: 404,
      ConflictError: 409,
      RateLimitError: 429,
    };
  }

  /**
   * Set formatter service for response formatting
   * @param {Object} formatter - FormatterService instance
   */
  setFormatter(formatter) {
    this.formatter = formatter;
  }

  /**
   * Handle error and send appropriate response
   * @param {Error} error - Error object
   * @param {Object} reply - Fastify reply object
   * @returns {Object} - Formatted error response
   */
  handleError(error, reply) {
    const errorName = error.name || "Error";
    const statusCode = this.errorMap[errorName] || 500;

    console.error(`[ErrorHandler] ${errorName}: ${error.message}`, error.stack);

    const response = this.formatter
      ? this.formatter.formatError(error, statusCode, error.details)
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
  handleNotFound(reply, message = "Resource not found") {
    const error = new Error(message);
    error.name = "NotFoundError";
    return this.handleError(error, reply);
  }

  /**
   * Handle validation errors
   * @param {Object} reply - Fastify reply object
   * @param {Array|String} details - Validation error details
   * @returns {Object} - Validation error response
   */
  handleValidationError(reply, details) {
    const error = new Error("Validation failed");
    error.name = "ValidationError";
    error.details = details;
    return this.handleError(error, reply);
  }

  /**
   * Handle authentication errors
   * @param {Object} reply - Fastify reply object
   * @param {String} message - Custom message
   * @returns {Object} - Authentication error response
   */
  handleAuthError(reply, message = "Authentication required") {
    const error = new Error(message);
    error.name = "AuthenticationError";
    return this.handleError(error, reply);
  }
}

module.exports = ErrorHandlerService;
