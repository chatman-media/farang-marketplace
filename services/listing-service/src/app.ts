import Fastify, { FastifyInstance } from "fastify"
import { config } from "dotenv"
import { z } from "zod"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3003),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default(6379),
  JWT_SECRET: z.string(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
  UPLOAD_PATH: z.string().default("uploads"),
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760), // 10MB
})

export const env = envSchema.parse(process.env)

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app
  const app = Fastify({
    logger: env.NODE_ENV === "development",
    bodyLimit: env.MAX_FILE_SIZE,
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
      service: "Listing Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "Listing management",
        "Service provider management",
        "AI-powered search",
        "Image upload",
        "Redis caching",
      ],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "listing-service",
      version: "2.0.0",
      environment: env.NODE_ENV,
    }
  })

  // Register routes
  await app.register(import("./routes/listings"), { prefix: "/api/listings" })
  await app.register(import("./routes/realEstate"), { prefix: "/api" })

  // Import controllers for Fastify routes
  const { ServiceProviderController } = await import("./controllers/ServiceProviderController")

  const serviceProviderController = new ServiceProviderController()

  await app.register((await import("./routes/serviceProviders")).default, {
    prefix: "/api/service-providers",
    serviceProviderController,
  })

  // Static file serving for uploads
  await app.register(import("@fastify/static"), {
    root: `${process.cwd()}/${env.UPLOAD_PATH}`,
    prefix: "/uploads/",
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
