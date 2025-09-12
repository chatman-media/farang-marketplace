import { createApp, env } from "./app"
import { logger } from "@marketplace/logger"

const start = async () => {
  try {
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    logger.info(`🚀 Listing service running on port ${env.PORT}`)
    logger.info(`📊 Health check: http://localhost:${env.PORT}/health`)
    logger.info(`📝 Listings API: http://localhost:${env.PORT}/api/listings`)
    logger.info(`🏢 Service Providers API: http://localhost:${env.PORT}/api/service-providers`)
    logger.info(`🤖 AI Search API: http://localhost:${env.PORT}/api/ai`)
  } catch (error) {
    logger.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("🛑 SIGINT received, shutting down gracefully")
  process.exit(0)
})

// Start the application
start()

// Export for testing and external use
export { createApp, env }
