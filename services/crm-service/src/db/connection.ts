import * as schema from "@marketplace/database-schema"
import { drizzle, postgres } from "@marketplace/database-schema"
import dotenv from "dotenv"

// Only load .env if not in test mode (tests handle their own env loading)
if (process.env.NODE_ENV !== "test") {
  dotenv.config()
}

// Lazy initialization to ensure env vars are loaded first
let sql: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle> | null = null

function getConnection() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required")
    }
    sql = postgres(connectionString, {
      max: 20,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    })
    db = drizzle(sql, { schema })
  }
  return { sql, db }
}

// SQL client for raw queries (backward compatibility)
const query = async (text: string, params?: any[]) => {
  const { sql } = getConnection()
  const result = await sql.unsafe(text, params)
  return {
    rows: result,
    // For INSERT/UPDATE/DELETE, postgres.js returns result.count
    // For SELECT, it returns an array, so we use result.length
    rowCount: result.count !== undefined ? result.count : result.length,
  }
}

async function closePool(): Promise<void> {
  if (sql) {
    await sql.end()
    sql = null
    db = null
  }
}

// Export getters that use lazy initialization
export { closePool, query, schema }
export function getDb() {
  return getConnection().db
}
export function getSql() {
  return getConnection().sql
}
export default getDb()
