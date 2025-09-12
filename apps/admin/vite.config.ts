import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@marketplace/shared-types": fileURLToPath(new URL("../../packages/shared-types/src", import.meta.url)),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
})
