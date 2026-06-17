import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Tests the consolidated env schema in env.ts.
 *
 * env.ts parses `process.env` at module load, so each case mutates
 * `process.env`, resets the module registry, then re-imports `./env` to get a
 * freshly-parsed `env` object. The working directory during the test run has no
 * local `.env`, so dotenv's `config()` is a no-op and does not clobber the
 * values we set here.
 */
describe("env schema", () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    // Restore the original environment between cases so they stay isolated.
    process.env = { ...ORIGINAL_ENV }
  })

  async function loadEnv() {
    const mod = await import("../env")
    return mod.env
  }

  it("coerces string PORT into a number", async () => {
    process.env.PORT = "8080"
    const env = await loadEnv()
    expect(env.PORT).toBe(8080)
    expect(typeof env.PORT).toBe("number")
  })

  it("applies the default PORT when unset", async () => {
    process.env.PORT = undefined as unknown as string
    delete process.env.PORT
    const env = await loadEnv()
    expect(env.PORT).toBe(3000)
  })

  it("coerces RATE_LIMIT_MAX and REDIS_PORT / REDIS_DB into numbers", async () => {
    process.env.RATE_LIMIT_MAX = "42"
    process.env.REDIS_PORT = "6380"
    process.env.REDIS_DB = "3"
    const env = await loadEnv()
    expect(env.RATE_LIMIT_MAX).toBe(42)
    expect(env.REDIS_PORT).toBe(6380)
    expect(env.REDIS_DB).toBe(3)
  })

  it("keeps ALLOWED_ORIGINS as a raw comma string (split happens at use-site)", async () => {
    process.env.ALLOWED_ORIGINS = "https://a.com,https://b.com"
    const env = await loadEnv()
    expect(env.ALLOWED_ORIGINS).toBe("https://a.com,https://b.com")
    expect(env.ALLOWED_ORIGINS.split(",")).toEqual(["https://a.com", "https://b.com"])
  })

  it.each([
    ["1", true],
    ["true", true],
    ["0", false],
    ["false", false],
    ["", false],
  ])("transforms RUN_WORKERS_INLINE=%j into %s", async (value, expected) => {
    process.env.RUN_WORKERS_INLINE = value
    const env = await loadEnv()
    expect(env.RUN_WORKERS_INLINE).toBe(expected)
  })

  it("RUN_WORKERS_INLINE is false when the var is absent", async () => {
    delete process.env.RUN_WORKERS_INLINE
    const env = await loadEnv()
    expect(env.RUN_WORKERS_INLINE).toBe(false)
  })

  it("accepts the three valid NODE_ENV values", async () => {
    for (const value of ["development", "production", "test"] as const) {
      vi.resetModules()
      process.env.NODE_ENV = value
      const env = await loadEnv()
      expect(env.NODE_ENV).toBe(value)
    }
  })

  it("throws when NODE_ENV is not one of the allowed enum values", async () => {
    process.env.NODE_ENV = "staging"
    await expect(loadEnv()).rejects.toThrow()
  })

  it("leaves optional integration keys undefined when unset", async () => {
    delete process.env.AI_SERVICE_URL
    delete process.env.TELEGRAM_BOT_TOKEN
    const env = await loadEnv()
    expect(env.AI_SERVICE_URL).toBeUndefined()
    expect(env.TELEGRAM_BOT_TOKEN).toBeUndefined()
  })

  it("surfaces optional integration keys when provided", async () => {
    process.env.AI_SERVICE_URL = "http://ai.local"
    process.env.STRIPE_SECRET_KEY = "sk_test_x"
    const env = await loadEnv()
    expect(env.AI_SERVICE_URL).toBe("http://ai.local")
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_x")
  })

  it("falls back to sane defaults for data/cache/auth keys", async () => {
    delete process.env.DATABASE_URL
    delete process.env.REDIS_HOST
    delete process.env.JWT_SECRET
    delete process.env.UPLOAD_PATH
    const env = await loadEnv()
    expect(env.DATABASE_URL).toContain("postgresql://")
    expect(env.REDIS_HOST).toBe("localhost")
    expect(env.JWT_SECRET).toBe("dev-jwt-secret-change-in-production")
    expect(env.UPLOAD_PATH).toBe("uploads")
  })
})
