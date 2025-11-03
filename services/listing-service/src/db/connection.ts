import * as schema from "@marketplace/database-schema"
import { drizzle, postgres } from "@marketplace/database-schema"

// Database configuration
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/thailand_marketplace"

// Create postgres client
const client = postgres(connectionString)

// Create drizzle instance with centralized schema
export const db = drizzle(client, { schema })

// Export types
export type Database = typeof db

// Re-export centralized schema for convenience
export { schema }

// Add query function for backward compatibility with raw SQL
export const query = async (sql: string, params?: any[]) => {
  const result = await client.unsafe(sql, params)
  return {
    rows: result,
    rowCount: result.length,
  }
}
