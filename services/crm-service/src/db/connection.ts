import * as schema from "@marketplace/database-schema"
import { drizzle, postgres } from "@marketplace/database-schema"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

const db = drizzle(sql, { schema })

// SQL client for raw queries (backward compatibility)
const query = async (text: string, params?: any[]) => {
  const result = await sql.unsafe(text, params)
  return {
    rows: result,
    rowCount: result.length,
  }
}

async function closePool(): Promise<void> {
  await sql.end()
}

export { db, sql, closePool, query, schema }
export default db
