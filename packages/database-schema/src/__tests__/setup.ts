import { execSync } from "node:child_process"
import path from "path"
import { config } from "dotenv"
import { afterAll, beforeAll } from "vitest"

// Load test environment variables (suppress dotenv tips)
config({ path: path.resolve(__dirname, "../../.env.test"), debug: false })

beforeAll(async () => {
  // Use DATABASE_URL from environment (set by CI) or fallback to test default
  const testDbUrl =
    process.env.DATABASE_URL || "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test"

  console.log("Test setup started")
  console.log("Test DB URL:", testDbUrl.replace(/:[^:]*@/, ":***@"))

  // Skip migration if already applied (CI pre-applies schema)
  // This prevents double application and speeds up tests
  if (!process.env.CI) {
    try {
      // Run database migrations using drizzle-kit push (local development only)
      console.log("Applying database schema...")
      const rootDir = path.resolve(__dirname, "../../")

      execSync("bun run db:push", {
        cwd: rootDir,
        env: {
          ...process.env,
          DATABASE_URL: testDbUrl,
        },
        stdio: "inherit",
      })

      console.log("Database schema applied successfully")
    } catch (error) {
      console.error("Failed to apply database schema:", error)
      throw error
    }
  } else {
    console.log("CI detected - skipping schema application (already applied)")
  }

  console.log("Test setup completed")
}, 60000) // Increase timeout for migrations

afterAll(() => {
  console.log("Test cleanup completed")
})
