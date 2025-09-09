import { createApp, gracefulShutdown, env } from "./app"
import { checkDatabaseConnection } from "./db/connection"

// Initialize modern job system
import "./jobs/modern-queue"

// Start the modern application
const start = async () => {
  try {
    console.log("🚀 Starting Payment Service v2.0...")

    // Check database connection
    const dbHealthy = await checkDatabaseConnection()
    if (!dbHealthy) {
      throw new Error("Database connection failed")
    }
    console.log("✅ Database connected")

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    console.log(`🚀 Payment Service v2.0 running on port ${env.PORT}`)
    console.log(`📊 Environment: ${env.NODE_ENV}`)
    console.log(`🔗 TON Network: ${env.TON_NETWORK}`)
    console.log(`💳 Modern Payment Service initialized with:`)
    console.log(`   - Fastify 5.x for high performance`)
    console.log(`   - BullMQ for job processing`)
    console.log(`   - TON Connect 3.5 integration`)
    console.log(`   - Zod validation`)
    console.log(`   - TypeScript 5.8`)
    console.log(`   - Drizzle ORM 0.38`)

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
    console.error("❌ Failed to start Payment Service:", error)
    process.exit(1)
  }
}

// Start the application
start()
