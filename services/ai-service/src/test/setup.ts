import dotenv from "dotenv"
import { afterAll, beforeAll, beforeEach } from "vitest"

// Load test environment variables (suppress dotenv tips)
dotenv.config({ path: ".env.test", debug: false })

// Global test setup
beforeAll(async () => {
  console.log("🧪 Setting up AI Service tests...")

  // Set test environment
  process.env["NODE_ENV"] = "test"
  process.env["AI_PROVIDER"] = "mock"

  // Mock external services
  process.env["USER_SERVICE_URL"] = "http://localhost:3001"
  process.env["LISTING_SERVICE_URL"] = "http://localhost:3002"

  console.log("✅ AI Service test setup complete")
})

afterAll(async () => {
  console.log("🧹 Cleaning up AI Service tests...")
  // Cleanup code here
  console.log("✅ AI Service test cleanup complete")
})

beforeEach(() => {
  // Reset any global state before each test
})

// Mock external API calls
;(global as any).fetch = async (url: string, options?: any) => {
  // Mock fetch for external API calls
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: {} }),
    text: async () => "Mock response",
  } as Response
}

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  console.error = (...args: any[]) => {
    // Only log errors that aren't expected test errors
    if (!args[0]?.toString().includes("Expected test error")) {
      originalConsoleError(...args)
    }
  }

  console.warn = (...args: any[]) => {
    // Only log warnings that aren't expected test warnings
    if (!args[0]?.toString().includes("Expected test warning")) {
      originalConsoleWarn(...args)
    }
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})
