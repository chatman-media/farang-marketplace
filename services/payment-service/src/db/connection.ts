import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { config } from "dotenv"
import * as schema from "./schema.js"

// Load environment variables
config()

// Database configuration
const connectionString =
  process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/marketplace_payments"

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

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end()
    console.log("Database connection closed")
  } catch (error) {
    console.error("Error closing database connection:", error)
  }
}
