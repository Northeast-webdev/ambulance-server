import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "dist", // Ensure output matches your server static file config
  },
  optimizeDeps: { exclude: ["svelte-navigator"] },
});
