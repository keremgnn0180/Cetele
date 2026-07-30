import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "./",

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          if (id.includes("recharts")) {
            return "charts";
          }

          if (id.includes("zod")) {
            return "zod";
          }

          return "vendor";
        },

        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },

    chunkSizeWarningLimit: 1000,
  },
});