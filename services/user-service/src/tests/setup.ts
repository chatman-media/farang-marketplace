import { vi, beforeEach } from 'vitest';

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'marketplace_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';

// Note: bcrypt is not mocked to allow real password hashing in tests

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock database connection for tests
export const mockDatabase = {
  query: vi.fn(),
  end: vi.fn(),
};

// Re-export fixtures for easy access in tests
export {
  userFixtures,
  createUserEntities,
  databaseRowFixtures,
  createUserTestData,
  updateUserTestData,
  mockUserStats,
} from './fixtures/database';

// Import fixtures for legacy test data
import {
  userFixtures,
  createUserTestData,
  updateUserTestData,
} from './fixtures/database';

// Legacy test data for backward compatibility
export const testUserData = {
  validUser: userFixtures.standardUser,
  validCreateData: createUserTestData.valid,
  invalidCreateData: createUserTestData.invalid,
  updateData: updateUserTestData.profileUpdate,
};
