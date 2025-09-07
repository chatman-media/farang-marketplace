import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Import services
import { AIProviderService } from "./services/AIProviderService.js"
import { RecommendationEngine } from "./services/RecommendationEngine.js"
import { ContentAnalysisService } from "./services/ContentAnalysisService.js"
import { UserBehaviorService } from "./services/UserBehaviorService.js"

// Import controllers
import { RecommendationController } from "./controllers/RecommendationController.js"
import { ContentAnalysisController } from "./controllers/ContentAnalysisController.js"
import { InsightsController } from "./controllers/InsightsController.js"

// Import routes
import { createRecommendationRoutes } from "./routes/recommendations.js"
import { createContentAnalysisRoutes } from "./routes/content-analysis.js"
import { createInsightsRoutes } from "./routes/insights.js"
import marketplaceIntegrationRoutes from "./routes/marketplace-integration.js"

// Import middleware
import { optionalAuth } from "./middleware/auth.js"

const app = express()
const PORT = process.env["PORT"] || 3006

// Security middleware
if (process.env["HELMET_ENABLED"] !== "false") {
  app.use(helmet())
}

// CORS configuration
const corsOptions = {
  origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env["RATE_LIMIT_WINDOW"] || "900000"), // 15 minutes
  max: parseInt(process.env["RATE_LIMIT_MAX"] || "100"), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Initialize services
const aiProviderService = new AIProviderService()
const recommendationEngine = new RecommendationEngine(aiProviderService)
const contentAnalysisService = new ContentAnalysisService(aiProviderService)
const userBehaviorService = new UserBehaviorService(aiProviderService)

// Initialize controllers
const recommendationController = new RecommendationController(recommendationEngine)
const contentAnalysisController = new ContentAnalysisController(contentAnalysisService)
const insightsController = new InsightsController(userBehaviorService)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Service is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      aiProvider: "operational",
      recommendations: "operational",
      contentAnalysis: "operational",
      userBehavior: "operational",
      marketplaceIntegration: "operational",
    },
  })
})

// Service status endpoint
app.get("/status", optionalAuth, (req, res) => {
  try {
    const providerStats = aiProviderService.getProviderStats()
    const recommendationStats = recommendationEngine.getStats()
    const contentAnalysisStats = contentAnalysisService.getStats()
    const behaviorStats = userBehaviorService.getStats()

    res.json({
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
    })
  } catch (error) {
    console.error("Error getting service status:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get service status",
    })
  }
})

// API routes
app.use("/api/recommendations", createRecommendationRoutes(recommendationController))
app.use("/api/content-analysis", createContentAnalysisRoutes(contentAnalysisController))
app.use("/api/insights", createInsightsRoutes(insightsController))
app.use("/api/marketplace", marketplaceIntegrationRoutes)

// AI Provider management endpoints (admin only)
app.get("/api/providers", (req, res) => {
  try {
    const providers = aiProviderService.getAvailableProviders()
    res.json({
      success: true,
      data: providers.map((p) => ({
        name: p.name,
        type: p.type,
        model: p.model,
        enabled: p.enabled,
        priority: p.priority,
      })),
    })
  } catch (error) {
    console.error("Error getting providers:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get AI providers",
    })
  }
})

app.get("/api/providers/stats", (req, res) => {
  try {
    const stats = aiProviderService.getProviderStats()
    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error getting provider stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get provider statistics",
    })
  }
})

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", error)

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env["NODE_ENV"] === "development" && { stack: error.stack }),
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  })
})

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("Received shutdown signal, closing server gracefully...")

  // Cleanup services
  userBehaviorService.destroy()

  process.exit(0)
}

process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env["NODE_ENV"] || "development"}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`📈 Status: http://localhost:${PORT}/status`)

  // Log available AI providers
  const providers = aiProviderService.getAvailableProviders()
  console.log(`🧠 Available AI providers: ${providers.map((p) => p.name).join(", ")}`)
})

export default app
