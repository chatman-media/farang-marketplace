import { z } from "zod"

// Environment schema for database configuration
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Parse environment variables
const env = envSchema.parse(process.env)

// Database configuration
export const config = {
  databaseUrl: env.DATABASE_URL,
  nodeEnv: env.NODE_ENV,

  // Connection pool settings
  pool: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // SSL configuration for production
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
} as const
