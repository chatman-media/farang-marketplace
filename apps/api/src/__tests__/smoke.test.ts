import type { FastifyInstance } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createApp } from "../app"

/**
 * Composition smoke test for the modular monolith: proves the root app boots
 * with all cross-cutting plugins, that every module mounts, and that each
 * module's routes are reachable (not 404). It does NOT assert business
 * behaviour — only that the wiring is correct.
 */
describe("modular-monolith composition", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it("boots and serves /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: "healthy", service: "api" })
  })

  it("serves the root endpoint", async () => {
    const res = await app.inject({ method: "GET", url: "/" })
    expect(res.statusCode).toBe(200)
  })

  // Each mounted module must answer (anything but 404 proves the route is mounted).
  const mountedRoutes: Array<{ method: "GET" | "POST"; url: string; module: string }> = [
    { method: "POST", url: "/api/auth/login", module: "user" },
    { method: "GET", url: "/api/listings", module: "listing" },
    { method: "GET", url: "/api/service-providers", module: "listing" },
    { method: "GET", url: "/api/agencies", module: "agency" },
    { method: "GET", url: "/api/bookings/search", module: "booking" },
    { method: "GET", url: "/api/crm/customers", module: "crm" },
  ]

  for (const route of mountedRoutes) {
    it(`mounts ${route.module} (${route.method} ${route.url})`, async () => {
      const res = await app.inject({ method: route.method, url: route.url })
      expect(res.statusCode).not.toBe(404)
    })
  }

  it("returns 404 for an unknown route via the unified handler", async () => {
    const res = await app.inject({ method: "GET", url: "/definitely/not/a/route" })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ success: false })
  })
})
