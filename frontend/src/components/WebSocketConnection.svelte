<!-- WebSocketConnection.svelte -->
<script>
  import { onMount, onDestroy } from "svelte";
  import websocket from "../stores/websocket";

  // Props
  export let resourceType = "car"; // Default resource type to connect to
  export let autoConnect = true; // Auto-connect on mount
  export let showStatus = false; // Show connection status

  // Local state
  let status = "...";
  let statusColor = "gray";

  // Handle status changes
  websocket.status.subscribe((state) => {
    if (state === "connecting") {
      status = "Connecting...";
      statusColor = "orange";
    } else if (state === "connected") {
      status = "Connected";
      statusColor = "green";
    } else if (state === "error") {
      status = "Error";
      statusColor = "red";

      // Add error details if available
      websocket.error.subscribe((errorMsg) => {
        if (errorMsg) {
          status = `Error: ${errorMsg}`;
        }
      });
    } else {
      status = "Disconnected";
      statusColor = "gray";
    }
  });

  // Create a store for this resource
  const resourceStore = websocket.subscribe(resourceType);

  // Connect on mount if autoConnect is true
  onMount(() => {
    if (autoConnect) {
      connect();
    }
  });

  // Clean up on destroy
  onDestroy(() => {
    disconnect();
  });

  // Connect to WebSocket
  function connect() {
    websocket.init();
    setTimeout(() => {
      // Subscribe to resource
      websocket.subscribeTopic(resourceType);
    }, 1000);
  }

  // Disconnect from WebSocket
  function disconnect() {
    websocket.unsubscribeTopic(resourceType);
    websocket.close();
  }

  // Reconnect to WebSocket
  function reconnect() {
    disconnect();
    setTimeout(connect, 500);
  }
</script>

{#if showStatus}
  <div class="websocket-status">
    <span class="status-indicator" style="background-color: {statusColor};"
    ></span>
    <span class="status-text">{status}</span>

    <div class="websocket-controls">
      {#if $websocket.connected}
        <button on:click={disconnect} class="ws-button disconnect">
          Disconnect
        </button>
      {:else if $websocket.connecting}
        <button disabled class="ws-button connecting"> Connecting... </button>
      {:else}
        <button on:click={connect} class="ws-button connect"> Connect </button>
      {/if}

      <button on:click={reconnect} class="ws-button reconnect">
        Reconnect
      </button>
    </div>
  </div>
{/if}

<style>
  .websocket-status {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  .status-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }

  .status-text {
    flex: 1;
  }

  .websocket-controls {
    display: flex;
    gap: 0.5rem;
  }

  .ws-button {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    background-color: #f0f0f0;
  }

  .ws-button:hover {
    opacity: 0.9;
  }

  .ws-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .connect {
    background-color: #4caf50;
    color: white;
  }

  .disconnect {
    background-color: #f44336;
    color: white;
  }

  .reconnect {
    background-color: #2196f3;
    color: white;
  }

  .connecting {
    background-color: #ff9800;
    color: white;
  }
</style>
