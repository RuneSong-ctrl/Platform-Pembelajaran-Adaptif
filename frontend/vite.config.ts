import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev proxy lets phones on the LAN reach the API through the same origin as the app.
  const apiTarget = env.DEV_API_PROXY_TARGET || "http://localhost:8000";
  const devPort = Number(env.DEV_PORT) || 3000;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true, // Listen on all network addresses (0.0.0.0 / local IP)
      port: devPort,
      open: false,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/uploads": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      host: true,
      port: 3000,
    },
  };
});
