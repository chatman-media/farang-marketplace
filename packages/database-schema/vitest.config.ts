import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Use threads instead of forks for better CI compatibility
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Exclude compiled files to avoid running tests twice
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.{idea,git,cache,output,temp}/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
