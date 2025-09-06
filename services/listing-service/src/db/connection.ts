import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Database configuration
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://localhost:5432/thailand_marketplace';

// Create postgres client
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
export * from './schema.js';
