import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Create database connection
export function createDatabaseConnection(connectionString: string) {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(client, { schema })
}

// Export type for the database instance
export type Database = ReturnType<typeof createDatabaseConnection>
