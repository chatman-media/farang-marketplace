import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@marketplace/shared-types": fileURLToPath(new URL("../../packages/shared-types/src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
    rollupOptions: {
      input: {
        main: "./index.html",
        server: "./src/entry-server.tsx",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "server" ? "entry-server.js" : "[name]-[hash].js"
        },
      },
    },
    ssr: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  ssr: {
    noExternal: ["@marketplace/shared-types"],
  },
})
