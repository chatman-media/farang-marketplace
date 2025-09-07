import fs from "fs"
import path from "path"
import { query } from "./connection"

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Get list of migration files
    const migrationsDir = path.join(__dirname, "migrations")
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()

    // Get already executed migrations
    const { rows: executedMigrations } = await query("SELECT filename FROM migrations ORDER BY id")
    const executedFilenames = executedMigrations.map((row) => row.filename)

    // Run pending migrations
    for (const filename of migrationFiles) {
      if (!executedFilenames.includes(filename)) {
        console.log(`Running migration: ${filename}`)

        const migrationPath = path.join(migrationsDir, filename)
        const migrationSQL = fs.readFileSync(migrationPath, "utf8")

        await query(migrationSQL)
        await query("INSERT INTO migrations (filename) VALUES ($1)", [filename])

        console.log(`✅ Migration ${filename} completed`)
      } else {
        console.log(`⏭️  Migration ${filename} already executed`)
      }
    }

    console.log("🎉 All migrations completed successfully")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { runMigrations }
