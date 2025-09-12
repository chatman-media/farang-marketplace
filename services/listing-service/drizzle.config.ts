import { config } from "dotenv"
import type { Config } from "drizzle-kit"

config()

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace",
  },
  verbose: true,
  strict: true,
} satisfies Config
