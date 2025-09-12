import { config } from "dotenv"
import Fastify, { FastifyInstance } from "fastify"
import { z } from "zod"
import { AvailabilityController } from "./controllers/AvailabilityController"
import { BookingController } from "./controllers/BookingController"
import { PricingController } from "./controllers/PricingController"
import { checkDatabaseConnection } from "./db/connection"
import { authMiddleware } from "./middleware/auth"
import { AvailabilityService } from "./services/AvailabilityService"
import { PricingService } from "./services/PricingService"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3004),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
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

  // Initialize services
  const availabilityService = new AvailabilityService()
  const pricingService = new PricingService()

  // Initialize controllers
  const bookingController = new BookingController()
  const availabilityController = new AvailabilityController(availabilityService)
  const pricingController = new PricingController(pricingService)

  // Register routes
  await app.register(import("./routes/bookings"), { prefix: "/api/bookings", bookingController })
  await app.register(import("./routes/availability"), {
    prefix: "/api/availability",
    availabilityController,
  })
  await app.register(import("./routes/pricing"), { prefix: "/api/pricing", pricingController })

  return app
}

export const gracefulShutdown = async (app: FastifyInstance, signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`)

  try {
    await app.close()
    console.log("✅ Server closed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error during shutdown:", error)
    process.exit(1)
  }
}
