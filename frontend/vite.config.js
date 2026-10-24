import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        ws: true,
        target: process.env.API_TARGET || "http://127.0.0.1:8000",
        changeOrigin: false,
      },
      "/ws": {
        target: process.env.API_TARGET || "http://127.0.0.1:8000",
        ws: true,
        changeOrigin: false,
      },
      "/healthz": { target: process.env.API_TARGET || "http://127.0.0.1:8000" },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
});
