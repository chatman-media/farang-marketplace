import { config } from "dotenv"

// Load test environment variables
config({ path: ".env.test" })

// Set test environment
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only"
process.env.REDIS_HOST = "localhost"
process.env.REDIS_PORT = "6379"
process.env.LOG_LEVEL = "silent"
process.env.CONSUL_PORT = "8500"

// Mock service URLs for testing
process.env.USER_SERVICE_URL = "http://localhost:3001"
process.env.LISTING_SERVICE_URL = "http://localhost:3002"
process.env.PAYMENT_SERVICE_URL = "http://localhost:3003"
process.env.BOOKING_SERVICE_URL = "http://localhost:3004"
process.env.AGENCY_SERVICE_URL = "http://localhost:3005"
process.env.AI_SERVICE_URL = "http://localhost:3006"
process.env.VOICE_SERVICE_URL = "http://localhost:3007"
process.env.CRM_SERVICE_URL = "http://localhost:3008"
