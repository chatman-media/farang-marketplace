import path from "node:path"
import dotenv from "dotenv"
import { afterEach, beforeEach, vi } from "vitest"

// Set NODE_ENV first so connection.ts knows we're in test mode
process.env.NODE_ENV = "test"

// Always load .env.test for test-specific env vars (WHATSAPP, Telegram tokens, etc.)
// override: false means existing env vars (e.g. DATABASE_URL set by CI) are not overwritten
const envPath = path.resolve(__dirname, "../../.env.test")
dotenv.config({ path: envPath, override: false })

if (process.env.CI) {
  console.log(`[setup.ts] CI mode — .env.test loaded (no override); DATABASE_URL: ${process.env.DATABASE_URL}`)
}

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})
