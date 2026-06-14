import { config } from "dotenv"
import { z } from "zod"

// Load environment variables (single root .env for the whole monolith)
config()

/**
 * Consolidated environment schema for the modular monolith. This is the union
 * of the keys the individual modules used to validate on their own. Modules
 * still read `process.env` internally; this schema validates the values the
 * root composition needs and documents the full surface in one place.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3000),

  // Data + cache
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/marketplace"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default(0),

  // Auth
  JWT_SECRET: z.string().default("dev-jwt-secret-change-in-production"),

  // HTTP
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
  UPLOAD_PATH: z.string().default("uploads"),
  RATE_LIMIT_MAX: z.string().transform(Number).default(1000),

  // Optional integrations (modules degrade gracefully when unset)
  AI_SERVICE_URL: z.string().optional(),
  TON_NETWORK: z.string().optional(),
  TON_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),

  // Worker control
  RUN_WORKERS_INLINE: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
})

export const env = envSchema.parse(process.env)
export type Env = typeof env
