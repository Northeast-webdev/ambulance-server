/**
 * WebSocketService.js
 * Service for managing WebSocket connections and real-time updates
 */

class WebSocketService {
  constructor(fastify, options = {}) {
    this.fastify = fastify;
    this.options = {
      path: options.path || "/ws",
      ...options,
    };

    // Map of active connections by user ID and connection ID
    this.connections = new Map();

    // Map of subscriptions by topic
    this.subscriptions = new Map();

    // Logger instance
    this.logger = options.logger || console;
  }

  /**
   * Initialize WebSocket server
   */
  initialize() {
    if (!this.fastify.websocketServer) {
      this.logger.error(
        "WebSocket server not available. Make sure fastify-websocket is registered."
      );
      return;
    }

    this.logger.info(
      `Initializing WebSocket service on path: ${this.options.path}`
    );

    // Register WebSocket route handler
    this.fastify.get(
      this.options.path,
      { websocket: true },
      (connection, req) => {
        this.handleConnection(connection, req);
      }
    );
  }

  /**
   * Handle new WebSocket connection
   * @param {Object} connection - WebSocket connection
   * @param {Object} request - Request object
   * @private
   */
  handleConnection(connection, request) {
    const connectionId = this.generateConnectionId();
    let userId = null;

    this.logger.info(`New WebSocket connection: ${connectionId}`);

    // Handle authentication
    this.authenticateConnection(connection, request)
      .then((user) => {
        userId = user ? user.id || user._id : "anonymous";

        // Store connection
        if (!this.connections.has(userId)) {
          this.connections.set(userId, new Map());
        }
        this.connections.get(userId).set(connectionId, connection);

        // Send welcome message
        this.sendToConnection(connection, {
          type: "connection",
          status: "connected",
          connectionId,
        });

        // Set up message handler
        connection.socket.on("message", (message) => {
          this.handleMessage(message, connection, userId, connectionId);
        });

        // Set up close handler
        connection.socket.on("close", () => {
          this.handleDisconnection(userId, connectionId);
        });
      })
      .catch((error) => {
        this.logger.error(
          `Authentication failed for WebSocket connection: ${connectionId}`,
          error
        );
        this.sendToConnection(connection, {
          type: "error",
          message: "Authentication failed",
          code: 401,
        });
        connection.socket.close();
      });
  }

  /**
   * Authenticate WebSocket connection
   * @param {Object} connection - WebSocket connection
   * @param {Object} request - Request object
   * @returns {Promise} - Promise resolving to user object
   * @private
   */
  async authenticateConnection(connection, request) {
    // JWT token can be passed in the URL or request headers
    const token =
      request.query.token ||
      request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      // Allow anonymous connections if configured
      if (this.options.allowAnonymous) {
        return null;
      }
      throw new Error("Authentication required");
    }

    try {
      // Use Fastify's JWT verification if available
      if (this.fastify.jwt) {
        return await this.fastify.jwt.verify(token);
      }

      // Fallback to custom verification
      // Implementation depends on the project's authentication system
      throw new Error("JWT verification not available");
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {String} rawMessage - Raw message from client
   * @param {Object} connection - WebSocket connection
   * @param {String} userId - User ID
   * @param {String} connectionId - Connection ID
   * @private
   */
  handleMessage(rawMessage, connection, userId, connectionId) {
    try {
      const message = JSON.parse(rawMessage);

      this.logger.debug(
        `Received message from ${userId}/${connectionId}:`,
        message
      );

      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(message, userId, connectionId);
          break;

        case "unsubscribe":
          this.handleUnsubscribe(message, userId, connectionId);
          break;

        case "ping":
          this.sendToConnection(connection, { type: "pong", time: Date.now() });
          break;

        default:
          this.logger.warn(`Unknown message type: ${message.type}`);
          this.sendToConnection(connection, {
            type: "error",
            message: `Unknown message type: ${message.type}`,
            code: 400,
          });
      }
    } catch (error) {
      this.logger.error(`Error handling WebSocket message: ${error.message}`);
      this.sendToConnection(connection, {
        type: "error",
        message: "Invalid message format",
        code: 400,
      });
    }
  }

  /**
   * Handle subscription request
   * @param {Object} message - Subscription message
   * @param {String} userId - User ID
   * @param {String} connectionId - Connection ID
   * @private
   */
  handleSubscribe(message, userId, connectionId) {
    const topics = Array.isArray(message.topics)
      ? message.topics
      : [message.topics];

    topics.forEach((topic) => {
      // Create topic subscription map if it doesn't exist
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Map());
      }

      // Create user subscription map if it doesn't exist
      if (!this.subscriptions.get(topic).has(userId)) {
        this.subscriptions.get(topic).set(userId, new Set());
      }

      // Add connection ID to subscriptions
      this.subscriptions.get(topic).get(userId).add(connectionId);

      this.logger.debug(
        `User ${userId} subscribed to ${topic} with connection ${connectionId}`
      );
    });

    // Send confirmation
    const userConnection = this.getUserConnection(userId, connectionId);
    if (userConnection) {
      this.sendToConnection(userConnection, {
        type: "subscribed",
        topics,
      });
    }
  }

  /**
   * Handle unsubscribe request
   * @param {Object} message - Unsubscribe message
   * @param {String} userId - User ID
   * @param {String} connectionId - Connection ID
   * @private
   */
  handleUnsubscribe(message, userId, connectionId) {
    const topics = Array.isArray(message.topics)
      ? message.topics
      : [message.topics];

    topics.forEach((topic) => {
      if (
        this.subscriptions.has(topic) &&
        this.subscriptions.get(topic).has(userId)
      ) {
        // Remove connection from topic subscriptions
        this.subscriptions.get(topic).get(userId).delete(connectionId);

        // Clean up empty maps
        if (this.subscriptions.get(topic).get(userId).size === 0) {
          this.subscriptions.get(topic).delete(userId);
        }

        if (this.subscriptions.get(topic).size === 0) {
          this.subscriptions.delete(topic);
        }

        this.logger.debug(
          `User ${userId} unsubscribed from ${topic} with connection ${connectionId}`
        );
      }
    });

    // Send confirmation
    const userConnection = this.getUserConnection(userId, connectionId);
    if (userConnection) {
      this.sendToConnection(userConnection, {
        type: "unsubscribed",
        topics,
      });
    }
  }

  /**
   * Handle client disconnection
   * @param {String} userId - User ID
   * @param {String} connectionId - Connection ID
   * @private
   */
  handleDisconnection(userId, connectionId) {
    this.logger.info(`WebSocket disconnected: ${userId}/${connectionId}`);

    // Remove connection from user connections
    if (this.connections.has(userId)) {
      this.connections.get(userId).delete(connectionId);

      if (this.connections.get(userId).size === 0) {
        this.connections.delete(userId);
      }
    }

    // Remove connection from all subscriptions
    this.subscriptions.forEach((userMap, topic) => {
      if (userMap.has(userId)) {
        userMap.get(userId).delete(connectionId);

        if (userMap.get(userId).size === 0) {
          userMap.delete(userId);
        }

        if (userMap.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
    });
  }

  /**
   * Get user's WebSocket connection
   * @param {String} userId - User ID
   * @param {String} connectionId - Connection ID
   * @returns {Object|null} - WebSocket connection or null
   * @private
   */
  getUserConnection(userId, connectionId) {
    if (
      this.connections.has(userId) &&
      this.connections.get(userId).has(connectionId)
    ) {
      return this.connections.get(userId).get(connectionId);
    }
    return null;
  }

  /**
   * Send message to a specific connection
   * @param {Object} connection - WebSocket connection
   * @param {Object} data - Data to send
   * @private
   */
  sendToConnection(connection, data) {
    try {
      const message = JSON.stringify(data);
      connection.socket.send(message);
    } catch (error) {
      this.logger.error(`Error sending WebSocket message: ${error.message}`);
    }
  }

  /**
   * Generate unique connection ID
   * @returns {String} - Unique ID
   * @private
   */
  generateConnectionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Publish event to subscribers of a topic
   * @param {String} topic - Topic to publish to
   * @param {Object} data - Data to publish
   * @param {Object} options - Publish options
   */
  publish(topic, data, options = {}) {
    if (!this.subscriptions.has(topic)) {
      return;
    }

    const message = {
      type: "event",
      topic,
      data,
      timestamp: Date.now(),
    };

    let recipientCount = 0;

    // Send to all subscribers of this topic
    this.subscriptions.get(topic).forEach((connectionIds, userId) => {
      // Check if user should receive this message
      if (options.excludeUsers && options.excludeUsers.includes(userId)) {
        return;
      }

      connectionIds.forEach((connectionId) => {
        const connection = this.getUserConnection(userId, connectionId);
        if (connection) {
          this.sendToConnection(connection, message);
          recipientCount++;
        }
      });
    });

    this.logger.debug(
      `Published event to topic ${topic}, sent to ${recipientCount} connections`
    );
    return recipientCount;
  }

  /**
   * Send message to a specific user on all their connections
   * @param {String} userId - User ID to send to
   * @param {Object} data - Data to send
   * @returns {Number} - Number of connections message was sent to
   */
  sendToUser(userId, data) {
    if (!this.connections.has(userId)) {
      return 0;
    }

    let count = 0;
    this.connections.get(userId).forEach((connection) => {
      this.sendToConnection(connection, data);
      count++;
    });

    return count;
  }

  /**
   * Broadcast message to all connected clients
   * @param {Object} data - Data to broadcast
   * @param {Object} options - Broadcast options
   * @returns {Number} - Number of connections message was sent to
   */
  broadcast(data, options = {}) {
    let count = 0;

    this.connections.forEach((connectionMap, userId) => {
      // Skip excluded users
      if (options.excludeUsers && options.excludeUsers.includes(userId)) {
        return;
      }

      connectionMap.forEach((connection) => {
        this.sendToConnection(connection, data);
        count++;
      });
    });

    return count;
  }
}

module.exports = WebSocketService;
