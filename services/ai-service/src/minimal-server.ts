import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import { RecommendationController } from "./controllers/RecommendationController"
import { RecommendationEngine } from "./services/RecommendationEngine"
import { AIProviderService } from "./services/AIProviderService"
import recommendationRoutes from "./routes/recommendations"

const createMinimalApp = async () => {
  const app = Fastify({
    logger: true,
  })

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "AI Service",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
    }
  })

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "AI Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: ["AI recommendations", "Content analysis", "Marketplace integration", "User behavior tracking"],
    }
  })

  // Simple marketplace integration endpoint
  app.get("/api/marketplace/health", async () => {
    return {
      status: "ok",
      service: "Marketplace Integration",
      timestamp: new Date().toISOString(),
    }
  })

  // Initialize recommendation services
  const aiProvider = new AIProviderService()
  const recommendationEngine = new RecommendationEngine(aiProvider)
  const recommendationController = new RecommendationController(recommendationEngine)

  // Register recommendation routes
  await app.register(recommendationRoutes, {
    prefix: "/api/recommendations",
    recommendationController,
  })

  return app
}

const start = async () => {
  try {
    const app = await createMinimalApp()

    const address = await app.listen({
      port: 3005,
      host: "0.0.0.0",
    })

    console.log("🚀 AI Service (minimal) running on", address)
  } catch (err) {
    console.error("Error starting server:", err)
    process.exit(1)
  }
}

start()
