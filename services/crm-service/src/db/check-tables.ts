import { logger } from "@marketplace/logger"
import dotenv from "dotenv"
import { query } from "./connection"

// Load environment variables
dotenv.config()

async function checkTables() {
  try {
    logger.info("🔍 Checking database tables...")

    // Check if message_templates table exists
    const tableCheck = await query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'message_templates'
      ORDER BY ordinal_position
    `)

    if (tableCheck.rows.length > 0) {
      logger.info("📋 Current message_templates table structure:")
      tableCheck.rows.forEach((row: any) => {
        logger.info(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`)
      })
    } else {
      logger.info("❌ message_templates table does not exist")
    }

    // Check all tables
    const allTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    logger.info("\n📊 All tables in database:")
    allTables.rows.forEach((row: any) => {
      logger.info(`  - ${row.table_name}`)
    })
  } catch (error) {
    logger.error("❌ Check failed:", error)
    process.exit(1)
  }
}

checkTables()
