import * as schema from "@marketplace/database-schema"
import { drizzle, postgres } from "@marketplace/database-schema"
import logger from "@marketplace/logger"
import { config } from "dotenv"

// Load environment variables
config()

// Database configuration
const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/marketplace_payments"

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create drizzle instance
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
})

// Export client for manual queries if needed
export { client }

// Re-export centralized schema for convenience
export { schema }

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    logger.error("Database connection failed:", error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end()
    logger.info("Database connection closed")
  } catch (error) {
    logger.error("Error closing database connection:", error)
  }
}
