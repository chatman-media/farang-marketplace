import { FastifyInstance } from "fastify"

/**
 * Encapsulated route plugin for the agency module.
 *
 * Registers ONLY this module's routes under their prefixes — no global plugins,
 * no root/health endpoints, no error handler, no listener. The standalone
 * `createApp()` calls this directly; the modular-monolith root mounts it via
 * `app.register(registerAgencyRoutes)` so it runs in its own encapsulated context.
 */
export async function registerAgencyRoutes(app: FastifyInstance): Promise<void> {
  await app.register(import("./agencies"), { prefix: "/api/agencies" })
  await app.register(import("./services"), { prefix: "/api/services" })
  await app.register(import("./assignments"), { prefix: "/api/assignments" })
  await app.register(import("./agency-services"), { prefix: "/api/agency-services" })
  await app.register(import("./service-assignments"), { prefix: "/api/service-assignments" })
  await app.register(import("./booking-integration"), {
    prefix: "/api/booking-integration",
  })
}
