import { defineConfig } from "vitest/config"
import path from "path"
import dotenv from "dotenv"

// Load test environment variables
dotenv.config({ path: path.join(__dirname, ".env.test") })

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      NODE_ENV: "test",
    },
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/tests/", "**/*.d.ts", "**/*.config.*", "dist/"],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@marketplace/shared-types": path.resolve(__dirname, "../../packages/shared-types/src"),
    },
  },
})
