import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Database configuration
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/thailand_marketplace"

// Create postgres client
const client = postgres(connectionString)

// Create drizzle instance with local schema
export const db = drizzle(client, { schema })

// Export types
export type Database = typeof db

// Re-export local schema
export * from "./schema"
