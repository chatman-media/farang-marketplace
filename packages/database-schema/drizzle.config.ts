import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config()

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.TEST_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace",
  },
  verbose: true,
  strict: true,
})
