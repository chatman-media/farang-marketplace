import { createApp } from "./app.js"
import { env } from "./config/environment.js"

async function start() {
  try {
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    app.log.info(`🚀 API Gateway started on port ${env.PORT}`)
    app.log.info(`📊 Health check: http://localhost:${env.PORT}/health`)
    app.log.info(`📈 Metrics: http://localhost:${env.PORT}/metrics`)
    app.log.info(`🔍 Services: http://localhost:${env.PORT}/services`)
  } catch (error) {
    console.error("Failed to start API Gateway:", error)
    process.exit(1)
  }
}

start()
