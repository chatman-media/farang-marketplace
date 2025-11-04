import dotenv from "dotenv"
import { afterEach, beforeEach, vi } from "vitest"

// Set NODE_ENV first so connection.ts knows we're in test mode
process.env.NODE_ENV = "test"

// Load test environment variables with override to ensure they take precedence
// over any .env files loaded from parent directories
dotenv.config({ path: ".env.test", override: true })

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})
