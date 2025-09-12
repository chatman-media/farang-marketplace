import dotenv from "dotenv"
import { afterEach, beforeEach, vi } from "vitest"

// Load test environment variables (suppress dotenv tips)
dotenv.config({ path: ".env.test", debug: false })

// Mock environment variables with correct values
process.env.DB_HOST = "localhost"
process.env.DB_PORT = "5432"
process.env.DB_NAME = "marketplace"
process.env.DB_USER = "marketplace_user"
process.env.DB_PASSWORD = "marketplace_pass"
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret-key"

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})
