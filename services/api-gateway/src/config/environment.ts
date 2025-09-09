import { z } from "zod"
import { config } from "dotenv"

// Load environment variables
config()

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("3000"),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Redis Configuration
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default("0"),

  // CORS Configuration
  CORS_ORIGIN: z.string().default("*"),
  CORS_CREDENTIALS: z.string().transform(Boolean).default("true"),

  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default("1000"),
  RATE_LIMIT_SKIP_SUCCESSFUL: z.string().transform(Boolean).default("true"),

  // Security
  HELMET_ENABLED: z.string().transform(Boolean).default("true"),
  COMPRESSION_ENABLED: z.string().transform(Boolean).default("true"),

  // Logging
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  LOG_PRETTY: z.string().transform(Boolean).default("false"),

  // Health Check
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default("30000"), // 30 seconds
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).default("5000"), // 5 seconds

  // Circuit Breaker
  CIRCUIT_BREAKER_ENABLED: z.string().transform(Boolean).default("true"),
  CIRCUIT_BREAKER_THRESHOLD: z.string().transform(Number).default("5"),
  CIRCUIT_BREAKER_TIMEOUT: z.string().transform(Number).default("60000"), // 1 minute

  // Service Discovery
  SERVICE_DISCOVERY_ENABLED: z.string().transform(Boolean).default("false"),
  CONSUL_HOST: z.string().default("localhost"),
  CONSUL_PORT: z.string().transform(Number).default("8500"),

  // Monitoring
  METRICS_ENABLED: z.string().transform(Boolean).default("true"),
  METRICS_PREFIX: z.string().default("api_gateway"),

  // Service URLs (fallback if service discovery is disabled)
  USER_SERVICE_URL: z.string().url().default("http://localhost:3001"),
  LISTING_SERVICE_URL: z.string().url().default("http://localhost:3002"),
  PAYMENT_SERVICE_URL: z.string().url().default("http://localhost:3003"),
  BOOKING_SERVICE_URL: z.string().url().default("http://localhost:3004"),
  AGENCY_SERVICE_URL: z.string().url().default("http://localhost:3005"),
  AI_SERVICE_URL: z.string().url().default("http://localhost:3006"),
  VOICE_SERVICE_URL: z.string().url().default("http://localhost:3007"),
  CRM_SERVICE_URL: z.string().url().default("http://localhost:3008"),
})

export type Environment = z.infer<typeof envSchema>

// Parse and validate environment variables
export const env = envSchema.parse(process.env)

// Export individual configurations for easier access
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
}

export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
}

export const corsConfig = {
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
  credentials: env.CORS_CREDENTIALS,
}

export const rateLimitConfig = {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW,
  skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL,
  redis: redisConfig,
}

export const loggerConfig = {
  level: env.LOG_LEVEL,
  prettyPrint: env.NODE_ENV === "development" && env.LOG_PRETTY,
}

export const healthCheckConfig = {
  interval: env.HEALTH_CHECK_INTERVAL,
  timeout: env.HEALTH_CHECK_TIMEOUT,
}

export const circuitBreakerConfig = {
  enabled: env.CIRCUIT_BREAKER_ENABLED,
  threshold: env.CIRCUIT_BREAKER_THRESHOLD,
  timeout: env.CIRCUIT_BREAKER_TIMEOUT,
}
