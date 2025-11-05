/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      testTimeout: 30000,
      hookTimeout: 30000,
      // Use threads instead of forks for better CI compatibility
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
  }),
)
