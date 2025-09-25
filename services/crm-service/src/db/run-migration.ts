import { readFileSync } from "fs"
import { join } from "path"

import logger from "@marketplace/logger"

import { query } from "./connection"

async function runMigration(migrationFile: string) {
  try {
    logger.info(`Running migration: ${migrationFile}`)

    const migrationPath = join(__dirname, "migrations", migrationFile)
    const sql = readFileSync(migrationPath, "utf8")

    // Remove comments and split by semicolon
    const cleanSql = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")

    const statements = cleanSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement)
          logger.info("✅ Executed statement")
        } catch (error) {
          logger.error("❌ Failed to execute statement:", `${statement.substring(0, 100)}...`)
          throw error
        }
      }
    }

    logger.info(`✅ Migration ${migrationFile} completed successfully`)
  } catch (error) {
    logger.error(`❌ Migration ${migrationFile} failed:`, error)
    throw error
  }
}

async function main() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    logger.error("Usage: npx tsx src/db/run-migration.ts <migration-file>")
    process.exit(1)
  }

  try {
    await runMigration(migrationFile)
    logger.info("🎉 All migrations completed successfully")
    process.exit(0)
  } catch (error) {
    logger.error("💥 Migration failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
