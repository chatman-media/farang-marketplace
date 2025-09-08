import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config()

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/marketplace_agencies",
  },
  verbose: true,
  strict: true,
})
