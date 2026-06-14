import * as schema from "@marketplace/database-schema"
import { sharedClient, sharedDb } from "@marketplace/database-schema"

// Single shared connection for the whole process (one pool in the monolith).
export const db = sharedDb()

// Export types
export type Database = typeof db

// Re-export centralized schema for convenience
export { schema }

// Add query function for backward compatibility with raw SQL
export const query = async (sql: string, params?: any[]) => {
  const result = await sharedClient().unsafe(sql, params)
  return {
    rows: result,
    rowCount: result.length,
  }
}
