import { vi, beforeEach } from "vitest"
import dotenv from "dotenv"

// Load test environment variables
dotenv.config({ path: ".env.test" })

// Mock environment variables with correct values
process.env.DB_HOST = "localhost"
process.env.DB_PORT = "5432"
process.env.DB_NAME = "marketplace"
process.env.DB_USER = "marketplace_user"
process.env.DB_PASSWORD = "marketplace_pass"
process.env.NODE_ENV = "test"

// Note: bcrypt is not mocked to allow real password hashing in tests

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock database connection for tests
export const mockDatabase = {
  query: vi.fn(),
  end: vi.fn(),
}

// Re-export fixtures for easy access in tests
export {
  userFixtures,
  createUserEntities,
  databaseRowFixtures,
  createUserTestData,
  updateUserTestData,
  mockUserStats,
} from "./fixtures/database"

// Import fixtures for legacy test data
import { userFixtures, createUserTestData, updateUserTestData } from "./fixtures/database"

// Legacy test data for backward compatibility
export const testUserData = {
  validUser: userFixtures.standardUser,
  validCreateData: createUserTestData.valid,
  invalidCreateData: createUserTestData.invalid,
  updateData: updateUserTestData.profileUpdate,
}
