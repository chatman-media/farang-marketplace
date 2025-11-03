import * as schema from "@marketplace/database-schema"
import { drizzle, postgres } from "@marketplace/database-schema"
import { config } from "dotenv"

config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/marketplace"

// Create a connection pool
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

export const db = drizzle(client, { schema })

export type Database = typeof db
export type Schema = typeof schema

// Re-export schema for convenience
export { schema }

// Note: apiRequests, apiResponses, auditLogs tables don't exist in centralized schema yet
// Uncomment when these tables are added:
// export const { apiRequests, apiResponses, auditLogs, users, sessions } = schema

export default db
