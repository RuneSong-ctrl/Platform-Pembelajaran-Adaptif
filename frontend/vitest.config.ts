import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Tests use the app defaults; a developer's .env (e.g. "/api/v1" for phone testing) must not change them.
  envDir: path.resolve(__dirname, "src/__tests__"),
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
