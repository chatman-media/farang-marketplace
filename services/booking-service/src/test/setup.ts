import { beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods for cleaner test output
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

beforeEach(() => {
  // Clear all mocks before each test
  if (typeof (globalThis as any).vi !== 'undefined') {
    (globalThis as any).vi.clearAllMocks();
  }
});
