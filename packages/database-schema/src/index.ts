// Export all schema components

// Export commonly used types
export type { InferInsertModel, InferSelectModel } from "drizzle-orm"
export type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

// Export database connection utilities
export { drizzle } from "drizzle-orm/postgres-js"
export { migrate } from "drizzle-orm/postgres-js/migrator"
// Re-export postgres for convenience
export { default as postgres } from "postgres"
export * from "./schema"
