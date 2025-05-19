/**
 * WebSocket Store
 * Svelte store for managing WebSocket connections and real-time data
 */

import { writable, derived, get } from "svelte/store";
import { token } from "./index";

// Configuration
const WS_RECONNECT_INTERVAL = 3000;
const WS_PING_INTERVAL = 30000;
const WS_PATH = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, "ws") + "/ws"
  : "ws://localhost:3000/ws";

// Create base stores
const connectionStatus = writable("disconnected");
const connectionError = writable(null);
const messageBuffer = writable([]);
const activeTopics = writable({});

// WebSocket instance and timer references
let socket = null;
let reconnectTimer = null;
let pingTimer = null;
let authToken = null;

// Maintain topic-specific stores
const topicStores = new Map();

/**
 * Create or get a store for a specific topic
 * @param {String} topic - The topic to subscribe to
 * @returns {Object} - A derived store with the latest data for the topic
 */
export function createTopicStore(topic) {
  if (!topicStores.has(topic)) {
    // Create a new store for this topic with null initial value
    const store = writable(null);

    // Add to topic stores map
    topicStores.set(topic, store);

    // Subscribe to the topic if we're connected
    if (get(connectionStatus) === "connected") {
      subscribeTopic(topic);
    }
  }

  return topicStores.get(topic);
}

/**
 * Initialize WebSocket connection
 */
export function initWebSocket() {
  // Close existing connection if any
  closeConnection();

  // Get the current authentication token
  authToken = get(token);

  try {
    // Build WebSocket URL with authentication token
    const wsUrl = authToken ? `${WS_PATH}?token=${authToken}` : WS_PATH;

    // Create new WebSocket connection
    socket = new WebSocket(wsUrl);

    // Set up event handlers
    socket.onopen = handleOpen;
    socket.onclose = handleClose;
    socket.onerror = handleError;
    socket.onmessage = handleMessage;

    // Update status
    connectionStatus.set("connecting");
    connectionError.set(null);
  } catch (error) {
    console.error("WebSocket initialization error:", error);
    connectionStatus.set("error");
    connectionError.set(error.message);
    scheduleReconnect();
  }
}

/**
 * Close WebSocket connection
 */
export function closeConnection() {
  // Clear timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (pingTimer) {
    clearTimeout(pingTimer);
    pingTimer = null;
  }

  // Close socket if it exists
  if (socket) {
    // Remove event handlers
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;

    // Close the connection
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }

    socket = null;
  }

  // Update status
  connectionStatus.set("disconnected");
}

/**
 * Handle WebSocket open event
 */
function handleOpen() {
  console.log("WebSocket connected");
  connectionStatus.set("connected");
  connectionError.set(null);

  // Send any buffered messages
  const buffer = get(messageBuffer);
  if (buffer.length > 0) {
    buffer.forEach((message) => sendMessage(message));
    messageBuffer.set([]);
  }

  // Subscribe to all active topics
  const topics = get(activeTopics);
  Object.keys(topics).forEach((topic) => {
    subscribeTopic(topic);
  });

  // Start ping interval
  startPingInterval();
}

/**
 * Handle WebSocket close event
 * @param {CloseEvent} event - Close event
 */
function handleClose(event) {
  console.log("WebSocket disconnected:", event.code, event.reason);

  // Update status based on close code
  if (event.code === 1000) {
    // Normal closure
    connectionStatus.set("disconnected");
  } else {
    // Abnormal closure
    connectionStatus.set("error");
    connectionError.set(event.reason || "Connection closed");
    scheduleReconnect();
  }

  // Clear ping timer
  if (pingTimer) {
    clearTimeout(pingTimer);
    pingTimer = null;
  }
}

/**
 * Handle WebSocket error event
 * @param {Event} event - Error event
 */
function handleError(event) {
  console.error("WebSocket error:", event);
  connectionStatus.set("error");
  connectionError.set("Connection error");
  // Error event is usually followed by close event, which will handle reconnection
}

/**
 * Handle WebSocket message event
 * @param {MessageEvent} event - Message event
 */
function handleMessage(event) {
  try {
    // Parse message data
    const message = JSON.parse(event.data);

    // Handle different message types
    switch (message.type) {
      case "event":
        handleEventMessage(message);
        break;

      case "pong":
        // Ping response received, connection is alive
        break;

      case "error":
        console.error("WebSocket error message:", message);
        break;

      case "subscribed":
        // Update active topics
        const topics = { ...get(activeTopics) };
        message.topics.forEach((topic) => {
          topics[topic] = true;
        });
        activeTopics.set(topics);
        break;

      case "unsubscribed":
        // Update active topics
        const currentTopics = { ...get(activeTopics) };
        message.topics.forEach((topic) => {
          delete currentTopics[topic];
        });
        activeTopics.set(currentTopics);
        break;

      default:
        console.log("Unknown WebSocket message type:", message.type, message);
    }
  } catch (error) {
    console.error("Error processing WebSocket message:", error, event.data);
  }
}

/**
 * Handle event message from WebSocket
 * @param {Object} message - Event message
 */
function handleEventMessage(message) {
  const { topic, data } = message;

  // Update the appropriate topic store
  if (topicStores.has(topic)) {
    topicStores.get(topic).set(data);
  }
}

/**
 * Schedule WebSocket reconnection
 */
function scheduleReconnect() {
  if (!reconnectTimer) {
    console.log(
      `Scheduling WebSocket reconnection in ${WS_RECONNECT_INTERVAL}ms`
    );
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;

      // Check if token has changed
      const currentToken = get(token);
      if (currentToken !== authToken) {
        authToken = currentToken;
      }

      initWebSocket();
    }, WS_RECONNECT_INTERVAL);
  }
}

/**
 * Start ping interval to keep connection alive
 */
function startPingInterval() {
  if (!pingTimer) {
    pingTimer = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendMessage({ type: "ping", time: Date.now() });
      }
    }, WS_PING_INTERVAL);
  }
}

/**
 * Send message to WebSocket server
 * @param {Object} message - Message to send
 */
function sendMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  } else if (message.important) {
    // Add important messages to buffer for retry
    messageBuffer.update((buffer) => [...buffer, message]);
  }
  return false;
}

/**
 * Subscribe to a topic
 * @param {String} topic - Topic to subscribe to
 */
export function subscribeTopic(topic) {
  sendMessage({
    type: "subscribe",
    topics: [topic],
    important: true,
  });

  // Update active topics
  activeTopics.update((topics) => ({ ...topics, [topic]: true }));
}

/**
 * Unsubscribe from a topic
 * @param {String} topic - Topic to unsubscribe from
 */
export function unsubscribeTopic(topic) {
  sendMessage({
    type: "unsubscribe",
    topics: [topic],
  });

  // Update active topics
  activeTopics.update((topics) => {
    const newTopics = { ...topics };
    delete newTopics[topic];
    return newTopics;
  });
}

/**
 * Check if a topic is active
 * @param {String} topic - Topic to check
 * @returns {Boolean} - True if topic is active
 */
export function isTopicActive(topic) {
  return !!get(activeTopics)[topic];
}

// Create derived stores for public consumption
export const connected = derived(
  connectionStatus,
  ($status) => $status === "connected"
);
export const connecting = derived(
  connectionStatus,
  ($status) => $status === "connecting"
);
export const error = connectionError;
export const status = connectionStatus;

// Listen for token changes to reconnect with new auth
token.subscribe((newToken) => {
  if (newToken !== authToken && get(connectionStatus) !== "connecting") {
    console.log("Auth token changed, reconnecting WebSocket");
    initWebSocket();
  }
});

// Export store object for convenience
const websocket = {
  connected,
  connecting,
  error,
  status,
  subscribe: (topic) => createTopicStore(topic),
  subscribeTopic: (topic) => subscribeTopic(topic),
  unsubscribeTopic: (topic) => unsubscribeTopic(topic),
  init: initWebSocket,
  close: closeConnection,
  send: sendMessage,
};

export default websocket;
