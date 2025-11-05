// biome-ignore assist/source/organizeImports: fix
import path from "path"

// IMPORTANT: Set DATABASE_URL FIRST before any imports that might use it
process.env.DATABASE_URL = "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace"
process.env.NODE_ENV = "test"

import dotenv from "dotenv"
import { beforeEach, vi } from "vitest"

// Load test environment variables (this will override if needed)
dotenv.config({ path: path.join(__dirname, "../../../.env.test") })
dotenv.config({ path: path.join(__dirname, "../../.env.test") })

// Note: bcrypt is not mocked to allow real password hashing in tests

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock database connection for tests
export const mockDatabase: {
  query: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
} = {
  query: vi.fn(),
  end: vi.fn(),
}

// Re-export fixtures for easy access in tests
export {
  createUserEntities,
  createUserTestData,
  databaseRowFixtures,
  mockUserStats,
  updateUserTestData,
  userFixtures,
} from "./fixtures/database"

// Import fixtures for legacy test data
import { createUserTestData, updateUserTestData, userFixtures } from "./fixtures/database"

// Legacy test data for backward compatibility
export const testUserData = {
  validUser: userFixtures.standardUser,
  validCreateData: createUserTestData.valid,
  invalidCreateData: createUserTestData.invalid,
  updateData: updateUserTestData.profileUpdate,
}
