import { createApp, env, gracefulShutdown } from "./app"
import { runMigrations } from "./database/migrate"

// Start the modern application
const start = async () => {
  try {
    console.log("🚀 Starting User Service v2.0...")

    // Run database migrations
    await runMigrations()
    console.log("✅ Database migrations completed")

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    console.log(`🚀 User Service v2.0 running on port ${env.PORT}`)
    console.log(`📊 Environment: ${env.NODE_ENV}`)
    console.log(`🔗 API Base URL: http://localhost:${env.PORT}/api`)
    console.log(`💚 Health check: http://localhost:${env.PORT}/health`)
  } catch (error) {
    console.error("Failed to start User Service:", error)
    process.exit(1)
  }
}

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  const app = await createApp()
  await gracefulShutdown(app, "SIGTERM")
})

process.on("SIGINT", async () => {
  const app = await createApp()
  await gracefulShutdown(app, "SIGINT")
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
