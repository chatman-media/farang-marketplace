/** biome-ignore-all lint/complexity/useLiteralKeys: Use old style dotenv */
import logger from "@marketplace/logger"
import dotenv from "dotenv"
import { afterAll, beforeAll, beforeEach } from "vitest"

// Load test environment variables (suppress dotenv tips)
dotenv.config({ path: ".env.test", debug: false })

// Global test setup
beforeAll(async () => {
  logger.info("🧪 Setting up AI Service tests...")

  // Set test environment
  process.env["NODE_ENV"] = "test"
  process.env["AI_PROVIDER"] = "mock"

  // Mock external services
  process.env["USER_SERVICE_URL"] = "http://localhost:3001"
  process.env["LISTING_SERVICE_URL"] = "http://localhost:3002"

  logger.info("✅ AI Service test setup complete")
})

afterAll(async () => {
  logger.info("🧹 Cleaning up AI Service tests...")
  // Cleanup code here
  logger.info("✅ AI Service test cleanup complete")
})

beforeEach(() => {
  // Reset any global state before each test
})

// Mock external API calls
;(global as any).fetch = async (_url: string, _options?: any) => {
  // Mock fetch for external API calls
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: {} }),
    text: async () => "Mock response",
  } as Response
}

// Mock console methods in tests to reduce noise
const originalConsoleError = logger.error
const originalConsoleWarn = logger.warn

beforeEach(() => {
  logger.error = (message: string, ...args: any[]) => {
    // Only log errors that aren't expected test errors
    if (!message.includes("Expected test error")) {
      originalConsoleError(message, ...args)
    }
  }

  logger.warn = (message: string, ...args: any[]) => {
    // Only log warnings that aren't expected test warnings
    if (!message.includes("Expected test warning")) {
      originalConsoleWarn(message, ...args)
    }
  }
})

afterAll(() => {
  logger.error = originalConsoleError
  logger.warn = originalConsoleWarn
})
