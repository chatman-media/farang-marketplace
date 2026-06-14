import logger, { createPinoLoggerOptions } from "@marketplace/logger"
import { config } from "dotenv"
import Fastify, { FastifyInstance } from "fastify"
import { z } from "zod"
import { checkDatabaseConnection } from "./db/connection"
import { authMiddleware } from "./middleware/auth"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3004),
  DATABASE_URL: z.string().default("postgresql://user:password@localhost:5432/marketplace_bookings"),
  JWT_SECRET: z.string().default("dev-jwt-secret-change-in-production"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
})

export const env = envSchema.parse(process.env)

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app with integrated logger
  const app = Fastify({
    logger: createPinoLoggerOptions("booking-service"),
    bodyLimit: 10 * 1024 * 1024, // 10MB
  })

  // Register plugins
  await app.register(import("@fastify/helmet"))
  await app.register(import("@fastify/compress"))

  await app.register(import("@fastify/cors"), {
    origin: env.ALLOWED_ORIGINS === "*" ? true : env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })

  await app.register(import("@fastify/rate-limit"), {
    max: env.RATE_LIMIT_MAX_REQUESTS,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      error: "Too many requests from this IP, please try again later.",
    }),
  })

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "Booking Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "Booking management",
        "Availability checking",
        "Dynamic pricing",
        "Payment integration",
        "Conflict resolution",
      ],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    try {
      const dbHealthy = await checkDatabaseConnection()

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "booking-service",
        version: "2.0.0",
        database: dbHealthy ? "connected" : "disconnected",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: env.NODE_ENV,
      }
    } catch (error) {
      app.log.error({ error }, "Health check failed")
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        service: "booking-service",
        version: "2.0.0",
        database: "error",
        error: "Health check failed",
      }
    }
  })

  // Register authentication decorator
  app.decorate("authenticate", authMiddleware)

  // Register routes (shared with the modular-monolith root)
  const { registerBookingRoutes } = await import("./routes")
  await registerBookingRoutes(app)

  return app
}

export const gracefulShutdown = async (app: FastifyInstance, signal: string) => {
  logger.info(`🛑 ${signal} received, shutting down gracefully`)

  try {
    await app.close()
    logger.info("✅ Server closed successfully")
    process.exit(0)
  } catch (error) {
    logger.error("❌ Error during shutdown:", error)
    process.exit(1)
  }
}
