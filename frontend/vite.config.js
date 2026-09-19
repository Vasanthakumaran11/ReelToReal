import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Point this at the ReelToReal API when you expose the pipeline over HTTP.
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/frames": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
