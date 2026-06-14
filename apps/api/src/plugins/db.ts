import { type Database, sharedDb } from "@marketplace/database-schema"
import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"

declare module "fastify" {
  interface FastifyInstance {
    db: Database
  }
}

/**
 * Decorates the app with the single, process-wide database connection.
 *
 * Wrapped in `fastify-plugin` so the `db` decorator escapes encapsulation and
 * is visible inside every mounted module. `sharedDb()` returns the same pool the
 * modules use via their own `db/connection.ts`, so the whole process holds
 * exactly one pool to the shared database.
 */
export default fp(
  async (app: FastifyInstance) => {
    app.decorate("db", sharedDb())
  },
  { name: "db" },
)
