import logger from "@marketplace/logger"

import { createApp, env, gracefulShutdown } from "./app"
import { connectRedis, disconnectRedis } from "./config/redis"

// Start the modern application
const start = async () => {
  try {
    logger.info("🚀 Starting User Service v2.0...")

    // Connect to Redis
    await connectRedis()
    logger.info("✅ Redis connection established")

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    logger.info(`🚀 User Service v2.0 running on port ${env.PORT}`)
    logger.info(`📊 Environment: ${env.NODE_ENV}`)
    logger.info(`🔗 API Base URL: http://localhost:${env.PORT}/api`)
    logger.info(`💚 Health check: http://localhost:${env.PORT}/health`)
  } catch (error) {
    logger.error("Failed to start User Service:", error)
    process.exit(1)
  }
}

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  const app = await createApp()
  await gracefulShutdown(app, "SIGTERM")
  await disconnectRedis()
})

process.on("SIGINT", async () => {
  const app = await createApp()
  await gracefulShutdown(app, "SIGINT")
  await disconnectRedis()
})

// Start the application
if (process.argv[1] && process.argv[1].endsWith("index")) {
  start()
}

// Export for testing and external use
export { createApp, env }
export { UserEntity } from "./models/User"
export { UserRepository } from "./repositories/UserRepository"
export { AuthService } from "./services/AuthService"
export { OAuthService } from "./services/OAuthService"
export { UserService } from "./services/UserService"
