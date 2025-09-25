import type { Config } from "drizzle-kit"

export default {
  schema: "../../packages/database-schema/src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
