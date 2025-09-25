import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { logger } from "@marketplace/logger"
import * as schema from "@marketplace/database-schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = postgres(connectionString, { max: 1 })
const db = drizzle(sql, { schema })

async function runMigrations() {
  try {
    logger.info("Starting database migrations...")
    await migrate(db, { migrationsFolder: "./drizzle" })
    logger.info("Database migrations completed successfully")
  } catch (error) {
    logger.error("Database migration failed:", error)
    throw error
  } finally {
    await sql.end()
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    logger.error("Migration script failed:", error)
    process.exit(1)
  })
}

export { runMigrations }
