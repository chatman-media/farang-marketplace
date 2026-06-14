import * as schema from "@marketplace/database-schema"
import { closeSharedConnection, sharedClient, sharedDb } from "@marketplace/database-schema"

// Backed by the single shared connection for the whole process (one pool in the
// monolith). The lazy getters are preserved for backward compatibility.

// SQL client for raw queries (backward compatibility)
const query = async (text: string, params?: any[]) => {
  const result = await sharedClient().unsafe(text, params || [])
  return {
    rows: result,
    // For INSERT/UPDATE/DELETE, postgres.js returns result.count
    // For SELECT, it returns an array, so we use result.length
    rowCount: result.count !== undefined ? result.count : result.length,
  }
}

async function closePool(): Promise<void> {
  await closeSharedConnection()
}

// Export getters that use the shared connection
export { closePool, query, schema }
export function getDb() {
  return sharedDb()
}
export function getSql() {
  return sharedClient()
}
export default getDb()
