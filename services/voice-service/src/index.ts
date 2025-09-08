import { createApp, gracefulShutdown, env } from "./app"

// Start the modern application
const start = async () => {
  try {
    console.log("🚀 Starting Voice Service v2.0...")

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    console.log(`🎤 Voice Service v2.0 running on port ${env.PORT}`)
    console.log(`📊 Environment: ${env.NODE_ENV}`)
    console.log(`🔗 Health check: http://localhost:${env.PORT}/health`)
    console.log(`🎵 Modern Voice Service initialized with:`)
    console.log(`   - Fastify 5.x for high performance`)
    console.log(`   - Large file upload support (50MB)`)
    console.log(`   - Multi-language speech processing`)
    console.log(`   - Real-time audio analysis`)
    console.log(`   - TypeScript 5.x`)

    // Setup graceful shutdown
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"]
    signals.forEach((signal) => {
      process.on(signal, () => gracefulShutdown(app, signal))
    })

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      app.log.error("Uncaught Exception:", error)
      gracefulShutdown(app, "uncaughtException")
    })

    process.on("unhandledRejection", (reason, promise) => {
      app.log.error("Unhandled Rejection at:", promise, "reason:", reason)
      gracefulShutdown(app, "unhandledRejection")
    })
  } catch (error) {
    console.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

start()
