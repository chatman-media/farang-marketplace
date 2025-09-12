import dotenv from "dotenv"
import { query } from "./connection"

// Load environment variables
dotenv.config()

async function checkTables() {
  try {
    console.log("🔍 Checking database tables...")

    // Check if message_templates table exists
    const tableCheck = await query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'message_templates'
      ORDER BY ordinal_position
    `)

    if (tableCheck.rows.length > 0) {
      console.log("📋 Current message_templates table structure:")
      tableCheck.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`)
      })
    } else {
      console.log("❌ message_templates table does not exist")
    }

    // Check all tables
    const allTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log("\n📊 All tables in database:")
    allTables.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`)
    })
  } catch (error) {
    console.error("❌ Check failed:", error)
    process.exit(1)
  }
}

checkTables()
