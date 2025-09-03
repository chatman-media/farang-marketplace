import { vi } from 'vitest'

// Mock environment variables
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_NAME = 'marketplace_test'
process.env.DB_USER = 'postgres'
process.env.DB_PASSWORD = 'postgres'

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})
