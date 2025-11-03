import * as schema from '@marketplace/database-schema';
import { drizzle, postgres } from '@marketplace/database-schema';

import { config } from '../config/database';

// Create database connection
const connectionString = config.databaseUrl;

// Create postgres client
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Re-export schema for convenience
export * from '@marketplace/database-schema';
