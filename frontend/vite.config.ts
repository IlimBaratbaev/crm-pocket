import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8090",
      "/_": "http://localhost:8090",
      "/wa": { target: "http://localhost:3001", rewrite: (p) => p.replace(/^\/wa/, "") },
    },
  },
});
