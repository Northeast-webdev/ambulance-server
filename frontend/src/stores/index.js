import { writable } from "svelte/store";
import websocket from "./websocket";

export const token = writable(null);
export const user = writable({});

// Export WebSocket store
export { websocket };
