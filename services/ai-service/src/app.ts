import Fastify, { FastifyInstance } from "fastify"
import { config } from "dotenv"
import { z } from "zod"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3006),
  JWT_SECRET: z.string(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  HELMET_ENABLED: z.string().default("true"),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default(100),
})

export const env = envSchema.parse(process.env)

// Import services
import { AIProviderService } from "./services/AIProviderService"
import { RecommendationEngine } from "./services/RecommendationEngine"
import { ContentAnalysisService } from "./services/ContentAnalysisService"
import { UserBehaviorService } from "./services/UserBehaviorService"

// Import controllers
import { FastifyRecommendationController } from "./controllers/FastifyRecommendationController"
import { ContentAnalysisController } from "./controllers/ContentAnalysisController"
import { FastifyInsightsController } from "./controllers/FastifyInsightsController"
import { FastifyMarketplaceIntegrationController } from "./controllers/FastifyMarketplaceIntegrationController"

// Import routes
import contentAnalysisRoutes from "./routes/fastify-content-analysis"
import insightsRoutes from "./routes/fastify-insights"
import marketplaceIntegrationRoutes from "./routes/fastify-marketplace-integration"
// import aiProviderRoutes from './routes/ai-providers'
// import modelManagementRoutes from './routes/model-management'
// import usageAnalyticsRoutes from './routes/usage-analytics'
// import systemRoutes from './routes/system'

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app
  const app = Fastify({
    logger: env.NODE_ENV === "development",
    bodyLimit: 10 * 1024 * 1024, // 10MB
  })

  // Register plugins
  if (env.HELMET_ENABLED === "true") {
    await app.register(import("@fastify/helmet"))
  }

  await app.register(import("@fastify/cors"), {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  })

  await app.register(import("@fastify/rate-limit"), {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    errorResponseBuilder: () => ({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    }),
  })

  // Register auth middleware
  await app.register(import("./middleware/fastify-auth"))

  // Initialize services
  const aiProviderService = new AIProviderService()
  const recommendationEngine = new RecommendationEngine(aiProviderService)
  const contentAnalysisService = new ContentAnalysisService(aiProviderService)
  const userBehaviorService = new UserBehaviorService(aiProviderService)

  // Initialize controllers
  const recommendationController = new FastifyRecommendationController(recommendationEngine)
  const contentAnalysisController = new ContentAnalysisController(contentAnalysisService)
  const fastifyInsightsController = new FastifyInsightsController(userBehaviorService)
  const marketplaceController = new FastifyMarketplaceIntegrationController()

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "AI Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "AI recommendations",
        "Content analysis",
        "User behavior insights",
        "Marketplace integration",
        "Fraud detection",
      ],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      success: true,
      message: "AI Service is running",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      services: {
        aiProvider: "operational",
        recommendations: "operational",
        contentAnalysis: "operational",
        userBehavior: "operational",
        marketplaceIntegration: "operational",
      },
    }
  })

  // Service status endpoint
  app.get("/status", async (request, reply) => {
    try {
      const providerStats = aiProviderService.getProviderStats()
      const recommendationStats = recommendationEngine.getStats()
      const contentAnalysisStats = contentAnalysisService.getStats()
      const behaviorStats = userBehaviorService.getStats()

      return {
        success: true,
        data: {
          aiProviders: providerStats,
          recommendations: recommendationStats,
          contentAnalysis: contentAnalysisStats,
          userBehavior: behaviorStats,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date(),
        },
      }
    } catch (error) {
      app.log.error("Error getting service status:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get service status",
      }
    }
  })

  // AI Provider management endpoints (admin only)
  app.get("/api/providers", async (request, reply) => {
    try {
      const providers = aiProviderService.getAvailableProviders()
      return {
        success: true,
        data: providers.map((p) => ({
          name: p.name,
          type: p.type,
          model: p.model,
          enabled: p.enabled,
          priority: p.priority,
        })),
      }
    } catch (error) {
      app.log.error("Error getting providers:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get AI providers",
      }
    }
  })

  app.get("/api/providers/stats", async (request, reply) => {
    try {
      const stats = aiProviderService.getProviderStats()
      return {
        success: true,
        data: stats,
      }
    } catch (error) {
      app.log.error("Error getting provider stats:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get provider statistics",
      }
    }
  })

  // Register routes
  await app.register(import("./routes/recommendations"), {
    prefix: "/api/recommendations",
    recommendationController,
  })
  app.register(contentAnalysisRoutes, { prefix: "/api/v1/content", contentAnalysisController })
  app.register(insightsRoutes, { prefix: "/api/insights", insightsController: fastifyInsightsController })
  app.register(marketplaceIntegrationRoutes, { prefix: "/api/marketplace", marketplaceController })
  // app.register(aiProviderRoutes, { prefix: '/api/v1/providers', aiProviderController })
  // app.register(modelManagementRoutes, { prefix: '/api/v1/models', modelManagementController })
  // app.register(usageAnalyticsRoutes, { prefix: '/api/v1/analytics', usageAnalyticsController })
  // app.register(systemRoutes, { prefix: '/api/v1/system', systemController })

  return app
}

export const gracefulShutdown = async (app: FastifyInstance, signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`)

  try {
    await app.close()
    console.log("✅ Server closed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error during shutdown:", error)
    process.exit(1)
  }
}
