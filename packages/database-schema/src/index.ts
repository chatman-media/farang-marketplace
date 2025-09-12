// Export all schema components
export * from "./schema"

// Export commonly used types
export type { InferSelectModel, InferInsertModel } from "drizzle-orm"

// Export database connection utilities
export { drizzle } from "drizzle-orm/postgres-js"
export { migrate } from "drizzle-orm/postgres-js/migrator"
export type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

// Re-export postgres for convenience
export { default as postgres } from "postgres"
