import { execSync } from "node:child_process"
import path from "path"
import { config } from "dotenv"
import { afterAll, beforeAll } from "vitest"

// Load test environment variables (suppress dotenv tips)
config({ path: path.resolve(__dirname, "../../.env.test"), debug: false })

beforeAll(async () => {
  // Set default test database URL if not provided
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test"
  }

  console.log("Test setup started")
  console.log("Test DB URL:", process.env.TEST_DATABASE_URL?.replace(/:[^:]*@/, ":***@"))

  try {
    // Run database migrations using drizzle-kit push
    console.log("Applying database schema...")
    const rootDir = path.resolve(__dirname, "../../")

    // Use drizzle-kit push to sync schema with test database
    execSync("bun run db:push", {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
      stdio: "inherit",
    })

    console.log("Database schema applied successfully")
  } catch (error) {
    console.error("Failed to apply database schema:", error)
    throw error
  }

  console.log("Test setup completed")
}, 60000) // Increase timeout for migrations

afterAll(() => {
  console.log("Test cleanup completed")
})
