import logger from "@marketplace/logger"
import { createApp } from "./app"
import { env } from "./env"

/**
 * HTTP entrypoint for the modular monolith. Starts ONLY the web server — no
 * background workers (those live in `worker.ts` and run as a separate process).
 */
async function start(): Promise<void> {
  const app = await createApp()

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`)
    try {
      await app.close()
      logger.info("API shut down successfully")
      process.exit(0)
    } catch (error) {
      logger.error("Error during shutdown:", error)
      process.exit(1)
    }
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))

  await app.listen({ port: env.PORT, host: "0.0.0.0" })

  logger.info(`🚀 Farang Marketplace API running on port ${env.PORT}`)
  logger.info(`📊 Environment: ${env.NODE_ENV}`)
  logger.info(`💚 Health check: http://localhost:${env.PORT}/health`)

  if (env.RUN_WORKERS_INLINE) {
    const { startWorkers } = await import("./worker")
    await startWorkers()
    logger.info("⚙️  Background workers started inline (RUN_WORKERS_INLINE=1)")
  }
}

start().catch((error) => {
  logger.error("Failed to start API:", error)
  process.exit(1)
})
