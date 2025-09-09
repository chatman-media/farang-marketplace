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
  TON_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
  TON_API_KEY: z.string(),
  TON_WALLET_ADDRESS: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  JWT_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)

// Create Fastify instance with modern configuration
export const createApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
    trustProxy: true,
    disableRequestLogging: env.NODE_ENV === "production",
  })

  // Register essential plugins
  await app.register(import("@fastify/helmet"), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })

  await app.register(import("@fastify/cors"), {
    origin:
      env.NODE_ENV === "production"
        ? ["https://thailand-marketplace.com", "https://app.thailand-marketplace.com"]
        : true,
    credentials: true,
  })

  await app.register(import("@fastify/compress"), {
    global: true,
    encodings: ["gzip", "deflate", "br"],
  })

  await app.register(import("@fastify/rate-limit"), {
    max: env.NODE_ENV === "production" ? 100 : 1000,
    timeWindow: "1 minute",
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
  })

  // Register JWT plugin
  await app.register(import("@fastify/jwt"), {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: "7d",
    },
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "payment-service",
      version: "2.0.0",
      environment: env.NODE_ENV,
      ton_network: env.TON_NETWORK,
    }
  })

  // API documentation endpoint
  app.get("/api", async () => {
    return {
      service: "Payment Service",
      version: "2.0.0",
      description: "Modern TON blockchain payment processing service",
      features: [
        "TON Connect 3.5 integration",
        "BullMQ job processing",
        "Fastify 5.x performance",
        "Zod validation",
        "TypeScript 5.8",
        "Drizzle ORM 0.38",
      ],
      endpoints: {
        payments: {
          "POST /api/v2/payments": "Create a new payment",
          "GET /api/v2/payments/search": "Search payments",
          "GET /api/v2/payments/:id": "Get payment by ID",
          "PATCH /api/v2/payments/:id/status": "Update payment status",
          "POST /api/v2/payments/:id/process-ton": "Process TON payment",
          "GET /api/v2/payments/:id/transactions": "Get payment transactions",
        },
        webhooks: {
          "POST /api/v2/webhooks/ton": "TON blockchain webhooks",
          "POST /api/v2/webhooks/payment": "Generic payment webhooks",
          "POST /api/v2/webhooks/refund": "Refund webhooks",
          "GET /api/v2/webhooks/health": "Webhook health check",
        },
      },
    }
  })

  // Register routes
  await app.register(import("./routes/payments"), { prefix: "/api/v1" })
  await app.register(import("./routes/webhooks"), { prefix: "/api/v1" })

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    app.log.error(error)

    if (error.validation) {
      return reply.code(400).send({
        error: "Validation Error",
        message: error.message,
        details: error.validation,
      })
    }

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.name,
        message: error.message,
      })
    }

    return reply.code(500).send({
      error: "Internal Server Error",
      message: env.NODE_ENV === "production" ? "Something went wrong" : error.message,
    })
  })

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      error: "Not Found",
      message: `Route ${request.method} ${request.url} not found`,
    })
  })

  return app
}

// Graceful shutdown handler
export const gracefulShutdown = async (app: FastifyInstance, signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`)

  try {
    // Close database connections
    const { closeDatabaseConnection } = await import("./db/connection")
    await closeDatabaseConnection()

    // Shutdown job queues
    const { shutdownJobs } = await import("./jobs/index")
    await shutdownJobs()

    // Close Fastify
    await app.close()

    app.log.info("✅ Graceful shutdown completed")
    process.exit(0)
  } catch (error) {
    app.log.error({ error }, "❌ Error during shutdown")
    process.exit(1)
  }
}
