/**
 * FormatterService.js
 * Service for standardizing API response formatting
 */

class FormatterService {
  /**
   * Format successful response with data
   * @param {*} data - Response data
   * @param {Object} options - Additional options
   * @returns {Object} - Formatted response
   */
  static formatResponse(data, options = {}) {
    const response = {
      success: true,
      data,
    };

    // Include metadata if provided
    if (options.meta) {
      response.meta = options.meta;
    }

    // Include pagination if provided
    if (options.pagination) {
      response.pagination = options.pagination;
    }

    // Include message if provided
    if (options.message) {
      response.message = options.message;
    }

    return response;
  }

  /**
   * Format paginated response
   * @param {Array} data - Data items
   * @param {Number} page - Current page
   * @param {Number} limit - Items per page
   * @param {Number} total - Total items
   * @returns {Object} - Formatted paginated response
   */
  static formatPaginated(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return FormatterService.formatResponse(data, {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }

  /**
   * Format error response
   * @param {Error|String} error - Error object or message
   * @param {Number} statusCode - HTTP status code
   * @param {Object} details - Additional error details
   * @returns {Object} - Formatted error response
   */
  static formatError(error, statusCode = 500, details = null) {
    const response = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : error,
        code: statusCode,
      },
    };

    // Include error details if provided
    if (details) {
      response.error.details = details;
    }

    return response;
  }
}

module.exports = FormatterService;
