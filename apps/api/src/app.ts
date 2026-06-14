import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { optionalAuthMiddleware } from "@marketplace/auth"
import { registerBookingRoutes } from "@marketplace/booking-service/routes"
import { registerCrmRoutes } from "@marketplace/crm-service/routes"
import { registerListingRoutes } from "@marketplace/listing-service/routes"
import { createPinoLoggerOptions } from "@marketplace/logger"
import { registerPaymentRoutes } from "@marketplace/payment-service/routes"
import { registerUserRoutes } from "@marketplace/user-service/routes"
import { registerAgencyRoutes } from "@thailand-marketplace/agency-service/routes"
import Fastify, { type FastifyInstance } from "fastify"
import { env } from "./env"
import authDecorator from "./plugins/auth"
import dbPlugin from "./plugins/db"

/**
 * Builds the modular-monolith Fastify app.
 *
 * Cross-cutting plugins (helmet, cors, compress, rate-limit, multipart, static)
 * are registered ONCE here — the module route plugins no longer register them.
 * `auth` and `db` are registered via fastify-plugin so their decorators are
 * visible inside every encapsulated module. Each module is mounted with
 * `app.register(registerXRoutes)`, which runs it in its own encapsulated context.
 *
 * No background workers (BullMQ / cron) are started here — see `worker.ts`.
 */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: createPinoLoggerOptions("api"),
    bodyLimit: 10 * 1024 * 1024, // 10MB
    trustProxy: true,
  })

  // --- Cross-cutting plugins (registered exactly once) ---
  await app.register(import("@fastify/helmet"), {
    contentSecurityPolicy: false,
  })
  await app.register(import("@fastify/cors"), {
    origin: env.NODE_ENV === "development" ? true : env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
  await app.register(import("@fastify/compress"), { global: true })
  await app.register(import("@fastify/rate-limit"), {
    max: env.RATE_LIMIT_MAX,
    timeWindow: "1 minute",
  })
  await app.register(import("@fastify/multipart"))

  const uploadsRoot = resolve(process.cwd(), env.UPLOAD_PATH)
  mkdirSync(uploadsRoot, { recursive: true })
  await app.register(import("@fastify/static"), {
    root: uploadsRoot,
    prefix: "/uploads/",
  })

  // --- Shared decorators (fastify-plugin → visible to all modules) ---
  await app.register(authDecorator)
  await app.register(dbPlugin)

  // Populate request.user opportunistically for every route (non-failing).
  app.addHook("onRequest", optionalAuthMiddleware)

  // --- Root endpoints ---
  app.get("/", async () => ({
    service: "Farang Marketplace API",
    version: "1.0.0",
    status: "running",
    framework: "Fastify 5.x (modular monolith)",
    timestamp: new Date().toISOString(),
  }))

  app.get("/health", async () => ({
    status: "healthy",
    service: "api",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }))

  // --- Mounted modules (each encapsulated) ---
  await app.register(registerUserRoutes)
  await app.register(registerListingRoutes)
  await app.register(registerAgencyRoutes)
  await app.register(registerCrmRoutes)
  await app.register(registerPaymentRoutes)
  await app.register(registerBookingRoutes)

  // --- Unified error / 404 handlers ---
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error(error)

    if (error.validation) {
      return reply.code(400).send({
        success: false,
        message: "Validation Error",
        details: error.validation,
      })
    }

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
      })
    }

    return reply.code(500).send({
      success: false,
      message: env.NODE_ENV === "production" ? "Internal server error" : error.message,
      ...(env.NODE_ENV === "development" && { stack: error.stack }),
    })
  })

  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      success: false,
      message: "Endpoint not found",
      path: request.url,
    })
  })

  return app
}
