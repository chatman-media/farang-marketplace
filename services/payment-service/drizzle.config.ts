import { config } from "dotenv"
import type { Config } from "drizzle-kit"

// Load environment variables
config({ path: ".env" })

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/marketplace_payments",
  },
  verbose: true,
  strict: true,
} satisfies Config
