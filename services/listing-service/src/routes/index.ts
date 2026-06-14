import { FastifyInstance } from "fastify"

/**
 * Encapsulated route plugin for the listing module.
 *
 * Registers ONLY this module's routes under their prefixes — no global plugins,
 * no static serving, no root/health endpoints, no error handler, no listener. The
 * standalone `createApp()` calls this directly; the modular-monolith root mounts it
 * via `app.register(registerListingRoutes)` so it runs in its own encapsulated context.
 */
export async function registerListingRoutes(app: FastifyInstance): Promise<void> {
  await app.register(import("./listings"), { prefix: "/api/listings" })
  await app.register(import("./categories"), { prefix: "/api/categories" })
  await app.register(import("./ai"), { prefix: "/api/ai" })

  // Import controllers for Fastify routes
  const { ServiceProviderController } = await import("../controllers/ServiceProviderController")

  const serviceProviderController = new ServiceProviderController()

  await app.register((await import("./serviceProviders")).default, {
    prefix: "/api/service-providers",
    serviceProviderController,
  })
}
