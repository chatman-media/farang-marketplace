import { fileURLToPath, URL } from "node:url"
import { codecovVitePlugin } from "@codecov/vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "web-app",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  base: "/", // Для GitHub Pages с кастомным доменом используем "/"
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
