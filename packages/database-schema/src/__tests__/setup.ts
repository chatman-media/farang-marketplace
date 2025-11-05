import { execSync } from "node:child_process"
import { config } from "dotenv"
import path from "path"
import postgres from "postgres"
import { afterAll, beforeAll, beforeEach } from "vitest"

// Load test environment variables (suppress dotenv tips)
config({ path: path.resolve(__dirname, "../../.env.test"), debug: false })

// Create a global connection for cleanup
const testDbUrl = process.env.DATABASE_URL || "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test"
const globalSql = postgres(testDbUrl)

beforeAll(async () => {
  console.log("Test setup started")
  console.log("Test DB URL:", testDbUrl.replace(/:[^:]*@/, ":***@"))

  // Clean database before all tests
  try {
    console.log("Cleaning test database...")
    await globalSql`TRUNCATE TABLE vehicle_calendar_pricing, vehicle_rentals, vehicle_maintenance, vehicles, chat_history, listings, ai_prompt_templates, users RESTART IDENTITY CASCADE`
  } catch (e) {
    console.log("Initial cleanup skipped (tables may not exist yet)")
  }

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

beforeEach(async () => {
  // Clean database before EACH test to ensure isolation
  try {
    await globalSql`TRUNCATE TABLE vehicle_calendar_pricing, vehicle_rentals, vehicle_maintenance, vehicles, chat_history, listings, ai_prompt_templates, users RESTART IDENTITY CASCADE`
  } catch (e) {
    // Ignore errors (tables may not exist in some tests)
  }
})

afterAll(async () => {
  await globalSql.end()
  console.log("Test cleanup completed")
})
