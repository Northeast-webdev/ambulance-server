import { svelte } from "@sveltejs/vite-plugin-svelte";
import * as path from "path";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    Icons({
      compiler: "svelte",
    }),
  ],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  build: {
    outDir: "dist", // Ensure output matches your server static file config
  },
  optimizeDeps: { exclude: ["svelte-navigator"] },
});
