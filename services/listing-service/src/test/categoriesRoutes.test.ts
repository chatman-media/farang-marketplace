import type { FastifyInstance } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createApp } from "../app"

// Exercises the categories routes + the standalone app's root/health/404 handlers
// through real HTTP injection. No DB is touched by any of these endpoints.
describe("categories routes + app shell", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("GET /api/categories", () => {
    it("returns all categories plus the enabled-only list", async () => {
      const res = await app.inject({ method: "GET", url: "/api/categories" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data.categories)).toBe(true)
      expect(body.data.categories.length).toBeGreaterThan(0)
      // Each entry is flattened config (category + label + enabled...).
      const transport = body.data.categories.find((c: any) => c.category === "transportation")
      expect(transport.enabled).toBe(true)
      expect(transport.label).toBe("Transportation")
      // Enabled-only excludes coming-soon categories.
      expect(body.data.enabledOnly).toContain("transportation")
      expect(body.data.enabledOnly).not.toContain("tours")
    })
  })

  describe("GET /api/categories/enabled", () => {
    it("returns only the enabled categories with config", async () => {
      const res = await app.inject({ method: "GET", url: "/api/categories/enabled" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.success).toBe(true)
      const cats = body.data.map((c: any) => c.category)
      expect(cats).toContain("transportation")
      expect(cats).toContain("services")
      expect(cats).not.toContain("tours")
      expect(cats).not.toContain("products")
    })
  })

  describe("GET /api/categories/:category", () => {
    it("returns config for a valid category", async () => {
      const res = await app.inject({ method: "GET", url: "/api/categories/services" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(body.data.category).toBe("services")
      expect(body.data.label).toBe("Services")
    })

    it("returns the coming-soon flag for a disabled category", async () => {
      const res = await app.inject({ method: "GET", url: "/api/categories/tours" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.enabled).toBe(false)
      expect(body.data.comingSoon).toBe(true)
    })

    it("rejects an unknown category via the route schema enum (400)", async () => {
      // The :category param has an enum schema, so Fastify validation fires first.
      const res = await app.inject({ method: "GET", url: "/api/categories/spaceship" })
      expect(res.statusCode).toBe(400)
    })
  })

  describe("app shell endpoints", () => {
    it("GET / returns service metadata", async () => {
      const res = await app.inject({ method: "GET", url: "/" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.service).toBe("Listing Service")
      expect(body.status).toBe("running")
      expect(Array.isArray(body.features)).toBe(true)
    })

    it("GET /health reports healthy", async () => {
      const res = await app.inject({ method: "GET", url: "/health" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.status).toBe("healthy")
      expect(body.service).toBe("listing-service")
    })

    it("unknown route hits the 404 handler", async () => {
      const res = await app.inject({ method: "GET", url: "/totally/unknown/path" })
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body.success).toBe(false)
      expect(body.message).toBe("Endpoint not found")
      expect(body.path).toBe("/totally/unknown/path")
    })
  })
})
