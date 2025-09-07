import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { config } from "dotenv"
import { checkDatabaseConnection, closeDatabaseConnection } from "./db/connection.js"

// Import routes
import agencyRoutes from "./routes/agencies.js"
import serviceRoutes from "./routes/services.js"
import assignmentRoutes from "./routes/assignments.js"
import bookingIntegrationRoutes from "./routes/booking-integration.js"

// Load environment variables
config()

const app = express()
const PORT = process.env.PORT || 3005

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
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

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection()

    res.json({
      success: true,
      message: "Agency Service is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: dbConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// API routes
app.use("/api/agencies", agencyRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/assignments", assignmentRoutes)
app.use("/api/booking-integration", bookingIntegrationRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  })
})

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", error)

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully")
  await closeDatabaseConnection()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully")
  await closeDatabaseConnection()
  process.exit(0)
})

// Start server
async function startServer() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection()
    if (!dbConnected) {
      console.error("Failed to connect to database")
      process.exit(1)
    }

    app.listen(PORT, () => {
      console.log(`🚀 Agency Service running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🏢 API: http://localhost:${PORT}/api/agencies`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
