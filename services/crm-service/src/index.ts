import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import crmRoutes from "./routes/crm"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3007

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  }
  next()
})

// Routes
app.use("/api/crm", crmRoutes)

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "CRM Service",
    version: "1.0.0",
    status: "running",
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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", error)

  res.status(error.status || 500).json({
    error: error.name || "Internal Server Error",
    message: error.message || "An unexpected error occurred",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 CRM Service running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/crm`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
    process.exit(0)
  })
})

export default app
