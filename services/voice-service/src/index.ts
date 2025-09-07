import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import helmet from "helmet"
import { errorHandler } from "./middleware/auth.js"
import voiceRoutes from "./routes/voice.js"

// Load environment variables
dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || "3007", 10)
const HOST = process.env.HOST || "localhost"

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
)

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://thailand-marketplace.com", "https://www.thailand-marketplace.com"]
        : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  })
)

// Body parsing middleware
app.use(express.json({ limit: "50mb" })) // Large limit for base64 audio
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Request logging middleware
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.url
  const userAgent = req.get("User-Agent") || "Unknown"

  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`)
  next()
})

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "voice-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
})

// API routes
app.use("/api/voice", voiceRoutes)

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "Thailand Marketplace Voice Service",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      transcribe: "POST /api/voice/transcribe",
      command: "POST /api/voice/command",
      upload: "POST /api/voice/upload",
      search: "POST /api/voice/search",
      navigate: "POST /api/voice/navigate",
      listing: "POST /api/voice/listing/create",
      languages: "GET /api/voice/languages",
      session: "GET /api/voice/session/:sessionId",
      stats: "GET /api/voice/stats",
    },
    features: [
      "Multi-language speech-to-text",
      "Voice command processing",
      "Voice search functionality",
      "Voice-assisted listing creation",
      "Voice navigation commands",
      "Real-time audio processing",
      "Session management",
      "Provider failover",
    ],
    supportedLanguages: [
      "th-TH (Thai)",
      "en-US (English US)",
      "en-GB (English UK)",
      "zh-CN (Chinese Simplified)",
      "ja-JP (Japanese)",
      "ko-KR (Korean)",
    ],
    providers: ["Google Cloud Speech-to-Text", "Azure Cognitive Services Speech", "OpenAI Whisper"],
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  })
})

// Error handling middleware
app.use(errorHandler)

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)

  server.close((err) => {
    if (err) {
      console.error("Error during server shutdown:", err)
      process.exit(1)
    }

    console.log("Server closed successfully")
    process.exit(0)
  })

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout")
    process.exit(1)
  }, 30000)
}

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🎤 Voice Service running on http://${HOST}:${PORT}`)
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`)
  console.log(`🔊 API endpoints: http://${HOST}:${PORT}/api/voice`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)

  // Log supported features
  console.log("\n🎯 Supported Features:")
  console.log("  • Multi-language speech-to-text transcription")
  console.log("  • Voice command processing and intent recognition")
  console.log("  • Voice-powered search functionality")
  console.log("  • Voice-assisted listing creation")
  console.log("  • Voice navigation commands")
  console.log("  • Real-time audio processing")
  console.log("  • Session management and tracking")
  console.log("  • Provider failover and load balancing")

  console.log("\n🌐 Supported Languages:")
  console.log("  • Thai (th-TH)")
  console.log("  • English US (en-US)")
  console.log("  • English UK (en-GB)")
  console.log("  • Chinese Simplified (zh-CN)")
  console.log("  • Japanese (ja-JP)")
  console.log("  • Korean (ko-KR)")

  console.log("\n🔌 Speech-to-Text Providers:")
  console.log("  • Google Cloud Speech-to-Text")
  console.log("  • Azure Cognitive Services Speech")
  console.log("  • OpenAI Whisper")

  console.log("\n✅ Voice Service ready to process audio commands!")
})

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  gracefulShutdown("UNCAUGHT_EXCEPTION")
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  gracefulShutdown("UNHANDLED_REJECTION")
})

export default app
