import { FastifyInstance } from "fastify"

/**
 * Encapsulated route plugin for the CRM module.
 *
 * Registers ONLY this module's routes under their prefixes — no global plugins,
 * no root/health endpoints, no error handler, no listener. The standalone
 * `createApp()` calls this directly; the modular-monolith root mounts it via
 * `app.register(registerCrmRoutes)` so it runs in its own encapsulated context.
 */
export async function registerCrmRoutes(app: FastifyInstance): Promise<void> {
  await app.register(import("./crm"), { prefix: "/api/crm" })
  await app.register(import("./webhooks"), { prefix: "/webhook" })
}
