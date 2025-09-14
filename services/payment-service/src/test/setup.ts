import logger from "@marketplace/logger"
import { config } from "dotenv"
import { afterAll, beforeAll } from "vitest"

// Load test environment variables
config({ path: ".env.test" })

// Global test setup
beforeAll(async () => {
  logger.info("🧪 Setting up payment service tests...")

  // Set test environment
  process.env.NODE_ENV = "test"

  // Mock external services if needed
  logger.info("✅ Payment service test setup complete")
})

// Global test cleanup
afterAll(async () => {
  logger.info("🧹 Cleaning up payment service tests...")

  // Cleanup test data if needed
  logger.info("✅ Payment service test cleanup complete")
})

// Mock logger methods in test environment
if (process.env.NODE_ENV === "test") {
  global.console = {
    ...console,
    log: () => {}, // Suppress logs in tests
    info: () => {},
    warn: () => {},
    error: logger.error, // Keep errors for debugging
  }
}
