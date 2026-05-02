/**
 * Vite configuration for CourtIQ Analytics frontend
 * Author: Juman Das (Frontend Lead)
 *
 * The proxy setting forwards /api/* to the Express backend during local dev,
 * eliminating cross-origin issues without changing CORS headers.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
