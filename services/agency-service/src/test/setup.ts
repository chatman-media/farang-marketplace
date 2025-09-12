import logger from "@marketplace/logger"
import { config } from "dotenv"
import { afterAll, beforeAll } from "vitest"

// Load test environment variables
config({ path: ".env.test" })

// Mock environment variables for testing
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-jwt-secret-key-for-agencies"
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_agencies"

// Global test setup
beforeAll(async () => {
  logger.info("🧪 Setting up agency service tests...")
})

// Global test cleanup
afterAll(async () => {
  logger.info("🧹 Cleaning up agency service tests...")
})
