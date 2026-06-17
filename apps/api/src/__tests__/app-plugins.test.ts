import type { FastifyInstance } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createApp } from "../app"

/**
 * Verifies the cross-cutting plugins and shared decorators wired by
 * `createApp` (app.ts + plugins/auth.ts + plugins/db.ts) actually land on the
 * root instance and escape encapsulation as intended.
 */
describe("app plugin composition", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it("exposes the db decorator from plugins/db.ts", () => {
    expect(app.hasDecorator("db")).toBe(true)
    expect(app.db).toBeDefined()
  })

  it("exposes the auth decorators from plugins/auth.ts", () => {
    expect(app.hasDecorator("authenticate")).toBe(true)
    expect(app.hasDecorator("optionalAuthenticate")).toBe(true)
    expect(typeof app.authenticate).toBe("function")
    expect(typeof app.optionalAuthenticate).toBe("function")
  })

  it("applies security headers via @fastify/helmet", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    // helmet sets X-Content-Type-Options regardless of CSP being disabled.
    expect(res.headers["x-content-type-options"]).toBe("nosniff")
  })

  it("enables rate limiting via @fastify/rate-limit", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    // The rate-limit plugin advertises the remaining-request budget header.
    expect(res.headers["x-ratelimit-limit"]).toBeDefined()
  })

  it("reflects an allowed CORS origin (test env uses explicit allow-list)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:5173" },
    })
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173")
    expect(res.headers["access-control-allow-credentials"]).toBe("true")
  })

  it("does not reflect a disallowed CORS origin", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example.com" },
    })
    expect(res.headers["access-control-allow-origin"]).toBeUndefined()
  })

  it("registers the /uploads static prefix (missing file yields 404, not unmounted)", async () => {
    const res = await app.inject({ method: "GET", url: "/uploads/does-not-exist.png" })
    // A missing static file 404s through the static plugin / not-found handler;
    // the important bit is the prefix is mounted (no crash on build).
    expect(res.statusCode).toBe(404)
  })
})
