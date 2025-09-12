import { config } from "dotenv"
import path from "path"
import { beforeAll } from "vitest"

// Load test environment variables (suppress dotenv tips)
config({ path: path.resolve(__dirname, "../../.env.test"), debug: false })

beforeAll(() => {
  // Set default test database URL if not provided
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test"
  }

  console.log("Test setup completed")
  console.log("Test DB URL:", process.env.TEST_DATABASE_URL?.replace(/:[^:]*@/, ":***@"))
})
