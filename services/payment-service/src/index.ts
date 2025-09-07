import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import rateLimit from "express-rate-limit"
import { config } from "dotenv"
import { checkDatabaseConnection, closeDatabaseConnection } from "./db/connection.js"

// Import routes
import paymentRoutes from "./routes/payments.js"
import webhookRoutes from "./routes/webhooks.js"

// Load environment variables
config()

const app = express()
const PORT = process.env.PORT || 3003

// Security middleware
if (process.env.HELMET_ENABLED !== "false") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  )
}

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: process.env.CORS_CREDENTIALS === "true",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}

app.use(cors(corsOptions))

// Compression middleware
if (process.env.COMPRESSION_ENABLED !== "false") {
  app.use(compression())
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use("/api/", limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection()

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "healthy" : "unhealthy",
      service: "payment-service",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    })
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "payment-service",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    })
  }
})

// API routes
app.use("/api/payments", paymentRoutes)
app.use("/api/webhooks", webhookRoutes)

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    service: "Payment Service",
    version: "1.0.0",
    description: "TON blockchain payment processing service",
    endpoints: {
      payments: {
        "POST /api/payments": "Create a new payment",
        "GET /api/payments/search": "Search payments",
        "GET /api/payments/:id": "Get payment by ID",
        "PATCH /api/payments/:id/status": "Update payment status",
        "POST /api/payments/:id/process-ton": "Process TON payment",
        "GET /api/payments/:id/transactions": "Get payment transactions",
      },
      webhooks: {
        "POST /api/webhooks/ton": "TON blockchain webhooks",
        "POST /api/webhooks/payment": "Generic payment webhooks",
        "POST /api/webhooks/refund": "Refund webhooks",
        "GET /api/webhooks/health": "Webhook health check",
      },
      system: {
        "GET /health": "Service health check",
        "GET /api": "API documentation",
      },
    },
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  })
})

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err)

  // Handle specific error types
  if (err.type === "entity.parse.failed") {
    res.status(400).json({
      error: "Bad Request",
      message: "Invalid JSON payload",
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (err.type === "entity.too.large") {
    res.status(413).json({
      error: "Payload Too Large",
      message: "Request payload exceeds size limit",
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Default error response
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  })
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)

  try {
    // Close database connections
    await closeDatabaseConnection()
    console.log("Database connections closed")

    // Close server
    server.close(() => {
      console.log("HTTP server closed")
      process.exit(0)
    })

    // Force close after 10 seconds
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down")
      process.exit(1)
    }, 10000)
  } catch (error) {
    console.error("Error during graceful shutdown:", error)
    process.exit(1)
  }
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 TON Network: ${process.env.TON_NETWORK || "testnet"}`)
  console.log(`💳 Payment Service initialized`)
})

// Handle graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  gracefulShutdown("uncaughtException")
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  gracefulShutdown("unhandledRejection")
})

export default app
