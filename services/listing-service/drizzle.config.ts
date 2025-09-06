import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://localhost:5432/thailand_marketplace',
  },
  verbose: true,
  strict: true,
} satisfies Config;
