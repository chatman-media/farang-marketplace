import * as schema from "@marketplace/database-schema"
import { closeSharedConnection, sharedClient, sharedDb } from "@marketplace/database-schema"
import logger from "@marketplace/logger"

// Single shared connection for the whole process (one pool in the monolith).
export const db = sharedDb()

// Export types
export type Database = typeof db

// Re-export centralized schema for convenience
export { schema }

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sharedClient()`SELECT 1`
    return true
  } catch (error) {
    logger.error("Database connection failed:", error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await closeSharedConnection()
    logger.info("Database connection closed")
  } catch (error) {
    logger.error("Error closing database connection:", error)
  }
}
