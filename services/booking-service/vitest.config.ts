import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "drizzle/", "**/*.test.ts", "**/*.config.ts", "src/test/"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@marketplace/shared-types": resolve(__dirname, "../../packages/shared-types/src"),
    },
  },
})
