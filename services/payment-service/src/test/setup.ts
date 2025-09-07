import { config } from 'dotenv';
import { beforeAll, afterAll } from 'vitest';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up payment service tests...');

  // Set test environment
  process.env.NODE_ENV = 'test';

  // Mock external services if needed
  console.log('✅ Payment service test setup complete');
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up payment service tests...');

  // Cleanup test data if needed
  console.log('✅ Payment service test cleanup complete');
});

// Mock console methods in test environment
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: () => {}, // Suppress logs in tests
    info: () => {},
    warn: () => {},
    error: console.error, // Keep errors for debugging
  };
}
