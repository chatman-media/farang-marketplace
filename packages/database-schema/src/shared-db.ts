import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import type { Database } from "./connection"
import * as schema from "./schema"

/**
 * Shared, process-wide database connection (a SINGLE postgres pool).
 *
 * In the modular monolith every module imports these singletons instead of
 * creating its own pool, so the whole process opens exactly one pool to the
 * shared `marketplace` database. Lazily initialised on first use so importing
 * the module has no side effects (and tests can set DATABASE_URL first).
 *
 * `sharedClient()` exposes the raw postgres-js client for modules that need raw
 * SQL or `SELECT 1` health checks; `sharedDb()` is the Drizzle instance.
 */
let _client: ReturnType<typeof postgres> | undefined
let _db: Database | undefined

export function sharedClient(): ReturnType<typeof postgres> {
  if (!_client) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — cannot create shared database connection")
    }
    _client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return _client
}

export function sharedDb(): Database {
  if (!_db) {
    _db = drizzle(sharedClient(), { schema }) as Database
  }
  return _db
}

export async function closeSharedConnection(): Promise<void> {
  if (_client) {
    await _client.end()
    _client = undefined
    _db = undefined
  }
}
