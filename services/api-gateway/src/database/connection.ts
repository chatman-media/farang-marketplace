import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { config } from "dotenv"
import * as schema from "@marketplace/database-schema"

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

// Re-export all schema tables for convenience
export const { apiRequests, apiResponses, auditLogs, users, sessions } = schema

export default db
