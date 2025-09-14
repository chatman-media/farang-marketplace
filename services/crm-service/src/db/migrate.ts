import logger from "@marketplace/logger"
import { readFileSync } from "fs"
import { join } from "path"
import { closePool, query } from "./connection"

async function runMigrations() {
  try {
    logger.info("🔄 Running CRM database migrations...")

    // Read and execute schema
    const schemaPath = join(__dirname, "schema.sql")
    const schema = readFileSync(schemaPath, "utf8")

    // Split by semicolon and execute each statement
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      try {
        await query(statement)
        logger.info(`✅ Executed: ${statement.substring(0, 50)}...`)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes("already exists")) {
          logger.info(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`)
        } else {
          throw error
        }
      }
    }

    logger.info("✅ CRM database migrations completed successfully!")
  } catch (error) {
    logger.error("❌ Migration failed:", error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
}

export { runMigrations }
