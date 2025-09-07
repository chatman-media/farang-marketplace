import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "dist/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/controllers": path.resolve(__dirname, "./src/controllers"),
      "@/middleware": path.resolve(__dirname, "./src/middleware"),
      "@/routes": path.resolve(__dirname, "./src/routes"),
      "@/db": path.resolve(__dirname, "./src/db"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/config": path.resolve(__dirname, "./src/config"),
    },
  },
})
