import { fileURLToPath, URL } from "node:url"
import { codecovVitePlugin } from "@codecov/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "ton-app",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@marketplace/shared-types": fileURLToPath(new URL("../../packages/shared-types/src", import.meta.url)),
    },
  },
  server: {
    port: 3002,
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
