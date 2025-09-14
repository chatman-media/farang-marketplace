import logger from "@marketplace/logger"
import { config } from "dotenv"
import Fastify, { FastifyInstance } from "fastify"
import { z } from "zod"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3001),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BASE_URL: z.string().default("http://localhost:3001"),
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
    origin: env.NODE_ENV === "development" ? true : ["https://yourdomain.com"],
    credentials: true,
  })
  await app.register(import("@fastify/multipart"))

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "User Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: ["User authentication", "OAuth integration", "Profile management", "JWT tokens", "Email verification"],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "user-service",
      version: "2.0.0",
      environment: env.NODE_ENV,
    }
  })

  // Register routes
  await app.register(import("./routes/auth"), { prefix: "/api/auth" })
  await app.register(import("./routes/profile"), { prefix: "/api/profile" })
  await app.register(import("./routes/oauth"), { prefix: "/api/oauth" })

  // Global error handler
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error(error)

    if (error.validation) {
      return reply.status(400).send({
        error: "Validation Error",
        message: error.message,
        details: error.validation,
        timestamp: new Date().toISOString(),
      })
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      })
    }

    return reply.status(500).send({
      error: "Internal Server Error",
      message: env.NODE_ENV === "production" ? "Something went wrong" : error.message,
      timestamp: new Date().toISOString(),
      ...(env.NODE_ENV === "development" && { stack: error.stack }),
    })
  })

  return app
}

// Graceful shutdown function
export const gracefulShutdown = async (app: FastifyInstance, signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  try {
    await app.close()
    logger.info("User Service shut down successfully")
    process.exit(0)
  } catch (error) {
    logger.error("Error during shutdown:", error)
    process.exit(1)
  }
}
