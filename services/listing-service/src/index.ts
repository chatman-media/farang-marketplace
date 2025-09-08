import { createApp, env } from "./app"

const start = async () => {
  try {
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    console.log(`🚀 Listing service running on port ${env.PORT}`)
    console.log(`📊 Health check: http://localhost:${env.PORT}/health`)
    console.log(`📝 Listings API: http://localhost:${env.PORT}/api/listings`)
    console.log(`🏢 Service Providers API: http://localhost:${env.PORT}/api/service-providers`)
    console.log(`🤖 AI Search API: http://localhost:${env.PORT}/api/ai`)
  } catch (error) {
    console.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  process.exit(0)
})

// Start the application
start()

// Export for testing and external use
export { createApp, env }
