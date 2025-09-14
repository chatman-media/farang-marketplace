import logger from "@marketplace/logger"
import dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"
import { query } from "./connection"

// Load environment variables
dotenv.config()

async function runTemplatesMigration() {
  try {
    logger.info("🔄 Running message templates migration...")

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, "migrations", "003_add_message_templates.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

    for (const statement of statements) {
      if (statement.trim()) {
        logger.info(`Executing: ${statement.substring(0, 50)}...`)
        await query(statement)
        logger.info("✅ Success")
      }
    }

    logger.info("🎉 Message templates migration completed successfully!")
  } catch (error) {
    logger.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

runTemplatesMigration()
