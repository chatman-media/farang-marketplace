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
      // Use forks for better CI stability (threads can timeout in CI)
      pool: "forks",
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  }),
)
