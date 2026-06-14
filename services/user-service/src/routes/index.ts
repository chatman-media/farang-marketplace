import { FastifyInstance } from "fastify"

/**
 * Encapsulated route plugin for the user module.
 *
 * Registers ONLY this module's routes under their prefixes — no global plugins,
 * no root/health endpoints, no error handler, no listener. The standalone
 * `createApp()` calls this directly; the modular-monolith root mounts it via
 * `app.register(registerUserRoutes)` so it runs in its own encapsulated context.
 */
export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
  await app.register(import("./auth"), { prefix: "/api/auth" })
  await app.register(import("./profile"), { prefix: "/api/profile" })
  await app.register(import("./oauth"), { prefix: "/api/oauth" })
}
