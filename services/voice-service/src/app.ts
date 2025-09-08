import { config } from "dotenv"
import Fastify, { FastifyInstance } from "fastify"
import { z } from "zod"

// Load environment variables
config()

// Environment validation with Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3007),
  HOST: z.string().default("localhost"),
  JWT_SECRET: z.string().optional(),
})

export const env = envSchema.parse(process.env)

export const createApp = async (): Promise<FastifyInstance> => {
  // Create Fastify app
  const app = Fastify({
    logger: env.NODE_ENV === "development",
    bodyLimit: 50 * 1024 * 1024, // 50MB for base64 audio
  })

  // Register plugins
  await app.register(import("@fastify/helmet"), {
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

  const allowedOrigins =
    env.NODE_ENV === "production"
      ? ["https://thailand-marketplace.com", "https://www.thailand-marketplace.com"]
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"]

  await app.register(import("@fastify/cors"), {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  })

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "Voice Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "Speech-to-text conversion",
        "Text-to-speech synthesis",
        "Voice analysis",
        "Multi-language support",
        "Real-time processing",
      ],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "voice-service",
      version: "2.0.0",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  })

  // Register routes
  await app.register(import("./routes/fastify-voice"), { prefix: "/api/voice" })

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
