import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 30000,
    // Workspace packages ship ESM-syntax in CJS-packaged dist; inline them so
    // vitest transforms them instead of letting strict ESM resolution choke on
    // extensionless relative re-exports (e.g. database-schema's `./connection`).
    server: {
      deps: {
        inline: [/@marketplace\//, /@thailand-marketplace\//],
      },
    },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_db",
      JWT_SECRET: "test-jwt-secret",
      ALLOWED_ORIGINS: "http://localhost:5173",
      // Payment module eagerly constructs its services at import time, so these
      // must be present for the module to load (dummy values for the smoke).
      STRIPE_SECRET_KEY: "sk_test_dummy",
      STRIPE_WEBHOOK_SECRET: "whsec_test_dummy",
      TON_NETWORK: "testnet",
      TON_API_KEY: "test-api-key",
      PAYMENT_WEBHOOK_SECRET: "test-webhook-secret",
    },
  },
})
