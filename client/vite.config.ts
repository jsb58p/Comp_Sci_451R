import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: '/Comp_Sci_451R/',
  plugins: [
    react({
      babel: {
        babelrc: true,
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://compsci451r-production.up.railway.app",
        changeOrigin: true,
      },
    },
  },
});
