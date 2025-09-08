import { readFileSync } from "fs"
import { join } from "path"
import { query } from "./connection"

async function runMigration(migrationFile: string) {
  try {
    console.log(`Running migration: ${migrationFile}`)

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
          console.log("✅ Executed statement")
        } catch (error) {
          console.error("❌ Failed to execute statement:", statement.substring(0, 100) + "...")
          throw error
        }
      }
    }

    console.log(`✅ Migration ${migrationFile} completed successfully`)
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error)
    throw error
  }
}

async function main() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error("Usage: npx tsx src/db/run-migration.ts <migration-file>")
    process.exit(1)
  }

  try {
    await runMigration(migrationFile)
    console.log("🎉 All migrations completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("💥 Migration failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
