import { createApp, gracefulShutdown, env } from "./app"
import { checkDatabaseConnection, closeDatabaseConnection } from "./db/connection"

// Start the modern application
const start = async () => {
  try {
    console.log("🚀 Starting Booking Service v2.0...")

    // Check database connection (optional for demo)
    try {
      const dbHealthy = await checkDatabaseConnection()
      if (dbHealthy) {
        console.log("✅ Database connected")
      } else {
        console.log("⚠️ Database not connected (continuing anyway)")
      }
    } catch (error) {
      console.log("⚠️ Database connection failed (continuing anyway):", (error as Error).message)
    }

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    console.log(`🏨 Booking Service v2.0 running on port ${env.PORT}`)
    console.log(`📊 Environment: ${env.NODE_ENV}`)
    console.log(`🔗 Health check: http://localhost:${env.PORT}/health`)
    console.log(`📅 Modern Booking Service initialized with:`)
    console.log(`   - Fastify 5.x for high performance`)
    console.log(`   - Database connection pooling`)
    console.log(`   - Rate limiting`)
    console.log(`   - Zod validation`)
    console.log(`   - TypeScript 5.x`)

    // Setup graceful shutdown
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"]
    signals.forEach((signal) => {
      process.on(signal, () => gracefulShutdown(app, signal))
    })

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      app.log.error({ error }, "Uncaught Exception")
      gracefulShutdown(app, "uncaughtException")
    })

    process.on("unhandledRejection", (reason, promise) => {
      app.log.error({ promise, reason }, "Unhandled Rejection")
      gracefulShutdown(app, "unhandledRejection")
    })
  } catch (error) {
    console.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

start()
