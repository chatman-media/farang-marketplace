import { config } from "dotenv"
import Fastify, { FastifyInstance } from "fastify"
import { z } from "zod"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3005),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
})

export const env = envSchema.parse(process.env)

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app
  const app = Fastify({
    logger: env.NODE_ENV === "development",
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

  // Register routes
  await app.register(import("./routes/agencies"), { prefix: "/api/agencies" })
  await app.register(import("./routes/services"), { prefix: "/api/services" })
  await app.register(import("./routes/assignments"), { prefix: "/api/assignments" })
  await app.register(import("./routes/agency-services"), { prefix: "/api/agency-services" })
  await app.register(import("./routes/service-assignments"), { prefix: "/api/service-assignments" })
  await app.register(import("./routes/booking-integration"), {
    prefix: "/api/booking-integration",
  })

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
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
