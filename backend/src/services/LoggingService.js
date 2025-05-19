/**
 * LoggingService.js
 * Service for standardized logging across the application
 */

class LoggingService {
  constructor(options = {}) {
    this.options = {
      level: options.level || "info",
      enableConsole: options.enableConsole !== false,
      prefix: options.prefix || "AmbulanceServer",
      ...options,
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };
  }

  /**
   * Log an error message
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  error(message, data = null) {
    this.log("error", message, data);
  }

  /**
   * Log a warning message
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  warn(message, data = null) {
    this.log("warn", message, data);
  }

  /**
   * Log an info message
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  info(message, data = null) {
    this.log("info", message, data);
  }

  /**
   * Log a debug message
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  debug(message, data = null) {
    this.log("debug", message, data);
  }

  /**
   * Log a trace message
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  trace(message, data = null) {
    this.log("trace", message, data);
  }

  /**
   * Create a child logger with additional context
   * @param {String} context - Context for the child logger
   * @param {Object} options - Additional options
   * @returns {LoggingService} - Child logger instance
   */
  child(context, options = {}) {
    const childPrefix = `${this.options.prefix}:${context}`;
    return new LoggingService({
      ...this.options,
      ...options,
      prefix: childPrefix,
    });
  }

  /**
   * Internal logging method
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @param {Object} data - Additional data
   * @private
   */
  log(level, message, data) {
    // Check if this level should be logged
    if (this.levels[level] > this.levels[this.options.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = this.options.prefix;
    const formattedMessage = `[${timestamp}] [${prefix}] [${level.toUpperCase()}] ${message}`;

    if (this.options.enableConsole) {
      const method =
        level === "error" ? "error" : level === "warn" ? "warn" : "log";

      if (data) {
        console[method](formattedMessage, data);
      } else {
        console[method](formattedMessage);
      }
    }

    // Additional logging targets can be added here (file, database, etc.)
  }

  /**
   * Static method to create a component-specific logger
   * @param {String} componentName - Name of the component
   * @param {Object} options - Additional options
   * @returns {LoggingService} - Component-specific logger
   */
  static getComponentLogger(componentName, options = {}) {
    // Create main service instance if it doesn't exist
    if (!LoggingService.mainInstance) {
      LoggingService.mainInstance = new LoggingService();
    }

    // Create child logger for the component
    return LoggingService.mainInstance.child(componentName, options);
  }
}

// Initialize static property
LoggingService.mainInstance = null;

module.exports = LoggingService;
