import path from "node:path"
import dotenv from "dotenv"
import { afterEach, beforeEach, vi } from "vitest"

// Set NODE_ENV first so connection.ts knows we're in test mode
process.env.NODE_ENV = "test"

// Load test environment variables with override to ensure they take precedence
// over any .env files loaded from parent directories
// Use absolute path to ensure .env.test is loaded correctly from any working directory
const envPath = path.resolve(__dirname, "../../.env.test")
dotenv.config({ path: envPath, override: true })

// Log DATABASE_URL for debugging (only in CI)
if (process.env.CI) {
  console.log(`[setup.ts] Loaded .env.test from: ${envPath}`)
  console.log(`[setup.ts] DATABASE_URL: ${process.env.DATABASE_URL}`)
}

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})
