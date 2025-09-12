import Fastify, { FastifyInstance } from "fastify"
import { corsConfig, env, loggerConfig, rateLimitConfig } from "./config/environment.js"
import { authMiddleware } from "./middleware/auth.js"
import { Router } from "./services/Router.js"
import { ServiceDiscovery } from "./services/ServiceDiscovery.js"

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app
  const app = Fastify({
    logger: loggerConfig.prettyPrint
      ? {
          level: loggerConfig.level,
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
            },
          },
        }
      : {
          level: loggerConfig.level,
        },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    trustProxy: true, // Important for API Gateway
  })

  // Register plugins
  if (env.HELMET_ENABLED) {
    await app.register(import("@fastify/helmet"), {
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    })
  }

  await app.register(import("@fastify/cors"), corsConfig)

  if (env.COMPRESSION_ENABLED) {
    await app.register(import("@fastify/compress"), {
      global: true,
      encodings: ["gzip", "deflate", "br"],
    })
  }

  // Register Redis for rate limiting
  await app.register(import("@fastify/redis"), {
    host: rateLimitConfig.redis.host,
    port: rateLimitConfig.redis.port,
    password: rateLimitConfig.redis.password,
    db: rateLimitConfig.redis.db,
  })

  const rateLimitPlugin = await import("@fastify/rate-limit")
  await app.register(rateLimitPlugin.default, {
    max: rateLimitConfig.max,
    timeWindow: rateLimitConfig.timeWindow,

    redis: app.redis,
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: `Too many requests from ${request.ip}. Try again later.`,
      retryAfter: Math.round(context.ttl / 1000),
      timestamp: new Date().toISOString(),
    }),
  })

  // Register JWT plugin
  await app.register(import("@fastify/jwt"), {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  })

  // Initialize service discovery
  const serviceDiscovery = new ServiceDiscovery()

  // Setup event listeners for service discovery
  serviceDiscovery.on("serviceUp", (serviceName, health) => {
    app.log.info(`Service ${serviceName} is now healthy`)
  })

  serviceDiscovery.on("serviceDown", (serviceName, health) => {
    app.log.warn(`Service ${serviceName} is now unhealthy`)
  })

  serviceDiscovery.on("healthChanged", (serviceName, isHealthy, health) => {
    app.log.info(`Service ${serviceName} health changed to ${isHealthy}`)
  })

  // Initialize router
  const router = new Router(serviceDiscovery)

  // Register authentication middleware
  app.addHook("preHandler", authMiddleware)

  // Setup routes
  await router.setupRoutes(app)

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "API Gateway",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "Service discovery",
        "Load balancing",
        "Circuit breaker",
        "Rate limiting",
        "Authentication",
        "Request routing",
        "Health monitoring",
      ],
      services: serviceDiscovery.getStats(),
    }
  })

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    app.log.info("Shutting down API Gateway...")

    try {
      await serviceDiscovery.stop()
      await app.close()
      app.log.info("API Gateway shut down successfully")
      process.exit(0)
    } catch (error) {
      app.log.error("Error during shutdown: %s", String(error))
      process.exit(1)
    }
  }

  process.on("SIGTERM", gracefulShutdown)
  process.on("SIGINT", gracefulShutdown)

  // Start service discovery
  await serviceDiscovery.start()

  return app
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})
