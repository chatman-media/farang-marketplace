import { FastifyInstance } from "fastify"
import type { ZodType } from "zod"

/**
 * Encapsulated route plugin for the payment module.
 *
 * Registers ONLY this module's routes under their prefixes — no global plugins,
 * no root/health endpoints, no error handler, no listener. The standalone
 * `createApp()` calls this directly; the modular-monolith root mounts it via
 * `app.register(registerPaymentRoutes)` so it runs in its own encapsulated context.
 *
 * Payment routes declare their Fastify `schema` with Zod (both request and
 * response), so this encapsulated context installs Zod-based validation and
 * serialization compilers. Because this is set on the encapsulated payment
 * instance, the rest of the monolith keeps Fastify's default ajv compiler.
 */
export async function registerPaymentRoutes(app: FastifyInstance): Promise<void> {
  app.setValidatorCompiler(({ schema }) => (data) => {
    const result = (schema as unknown as ZodType).safeParse(data)
    return result.success ? { value: result.data } : { error: result.error as unknown as Error }
  })
  app.setSerializerCompiler(
    ({ schema }) =>
      (data) =>
        JSON.stringify((schema as unknown as ZodType).parse(data)),
  )

  await app.register(import("./payments"), { prefix: "/api/v1" })
  await app.register(import("./webhooks"), { prefix: "/api/v1" })
}
