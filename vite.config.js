import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const { visualizer } = await import("rollup-plugin-visualizer");

  return {
    plugins: [
      react(),
      visualizer({
        filename: "stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    base: "./",
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
