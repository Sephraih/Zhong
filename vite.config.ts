import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Produce standard multi-file output (JS chunks + CSS) instead of a
    // single inlined HTML file. This is required for arena.ai and other
    // iframe/sandboxed environments that enforce CSP rules blocking inline
    // scripts/styles produced by vite-plugin-singlefile.
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libs into a separate chunk for better caching
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
