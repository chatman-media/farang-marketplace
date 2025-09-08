import { createApp, env } from "./app"
import { checkDatabaseConnection, closeDatabaseConnection } from "./db/connection"

const start = async () => {
  try {
    // Check database connection
    await checkDatabaseConnection()

    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    console.log(`🚀 Agency service running on port ${env.PORT}`)
    console.log(`📊 Health check: http://localhost:${env.PORT}/health`)
    console.log(`🏢 Agencies API: http://localhost:${env.PORT}/api/agencies`)
    console.log(`🔧 Services API: http://localhost:${env.PORT}/api/services`)
    console.log(`📋 Assignments API: http://localhost:${env.PORT}/api/assignments`)
    console.log(`🔗 Booking Integration API: http://localhost:${env.PORT}/api/booking-integration`)
  } catch (error) {
    console.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  await closeDatabaseConnection()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  await closeDatabaseConnection()
  process.exit(0)
})

// Start the application
start()

// Export for testing and external use
export { createApp, env }
