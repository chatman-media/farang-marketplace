import { logError, serviceLogger } from "@marketplace/logger"

import { createApp } from "./app.js"
import { env } from "./config/environment.js"

async function start() {
  try {
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    serviceLogger.info(`🚀 API Gateway started on port ${env.PORT}`)
    serviceLogger.info(`📊 Health check: http://localhost:${env.PORT}/health`)
    serviceLogger.info(`📈 Metrics: http://localhost:${env.PORT}/metrics`)
    serviceLogger.info(`🔍 Services: http://localhost:${env.PORT}/services`)
  } catch (error) {
    logError(serviceLogger, "Failed to start API Gateway", error as Error)
    process.exit(1)
  }
}

start()
