import { createPinoLoggerOptions } from "@marketplace/logger"
import { config } from "dotenv"
import Fastify, { FastifyError, FastifyInstance } from "fastify"
import { z } from "zod"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3008),
  DATABASE_URL: z.string().default("postgresql://user:password@localhost:5432/marketplace_agencies"),
  JWT_SECRET: z.string().default("dev-jwt-secret-change-in-production"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
})

export const env = envSchema.parse(process.env)

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app with integrated logger
  const app = Fastify({
    logger: createPinoLoggerOptions("agency-service"),
    bodyLimit: 10 * 1024 * 1024, // 10MB
  })

  // Register plugins
  await app.register(import("@fastify/helmet"))
  await app.register(import("@fastify/cors"), {
    origin: env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
  await app.register(import("@fastify/compress"))
  await app.register(import("@fastify/multipart"))
  await app.register(import("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
  })

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "Agency Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "Agency management",
        "Service provider management",
        "Booking integration",
        "Commission tracking",
        "Assignment management",
      ],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "agency-service",
      version: "2.0.0",
      environment: env.NODE_ENV,
    }
  })

  // Register routes (shared with the modular-monolith root)
  const { registerAgencyRoutes } = await import("./routes")
  await registerAgencyRoutes(app)

  // Global error handler
  app.setErrorHandler(async (error: FastifyError, _request, reply) => {
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

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      success: false,
      message: "Endpoint not found",
      path: request.url,
    })
  })

  return app
}
