import type { FastifyInstance } from "fastify"
import jwt from "jsonwebtoken"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// The ListingController endpoints are self-contained placeholder handlers (static
// mock data, no DB), so we exercise them end-to-end through the real app. Auth-
// protected routes need a Bearer token signed with the app's JWT secret.
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production"

import { createApp } from "../app"

const VALID_UUID = "11111111-1111-1111-1111-111111111111"

function authHeader(): Record<string, string> {
  const token = jwt.sign(
    { id: "user-1", email: "user1@test.local", role: "user", verified: true },
    process.env.JWT_SECRET as string,
  )
  return { authorization: `Bearer ${token}` }
}

describe("listing routes (ListingController)", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("public GET endpoints", () => {
    it("GET /api/listings/vehicles returns mock vehicles", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings/vehicles" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
    })

    it("GET /api/listings/products returns mock products", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings/products" })
      expect(res.statusCode).toBe(200)
      expect(res.json().success).toBe(true)
    })

    it("GET /api/listings/vehicles/:id echoes the id", async () => {
      const res = await app.inject({ method: "GET", url: `/api/listings/vehicles/${VALID_UUID}` })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(VALID_UUID)
    })

    it("GET /api/listings/products/:id echoes the id", async () => {
      const res = await app.inject({ method: "GET", url: `/api/listings/products/${VALID_UUID}` })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(VALID_UUID)
    })

    it("GET /api/listings/vehicles/search returns a placeholder result", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings/vehicles/search" })
      expect(res.statusCode).toBe(200)
      expect(res.json().success).toBe(true)
    })

    it("GET /api/listings/search returns a placeholder result", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings/search" })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toEqual([])
    })

    it("GET /api/listings/featured returns a placeholder result", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings/featured" })
      expect(res.statusCode).toBe(200)
      expect(res.json().success).toBe(true)
    })
  })

  describe("GET /api/listings (getAllListings)", () => {
    it("returns paginated listings with default paging", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.listings.length).toBeGreaterThan(0)
      expect(body.data.pagination.page).toBe(1)
      expect(body.data.pagination.limit).toBe(12)
      expect(body.data.pagination.total).toBeGreaterThan(0)
    })

    it("filters by category", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings?category=transportation" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.listings.length).toBeGreaterThan(0)
      for (const listing of body.data.listings) {
        expect(listing.category).toBe("transportation")
      }
    })

    it("honors page and limit query params", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings?page=2&limit=2" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.pagination.page).toBe(2)
      expect(body.data.pagination.limit).toBe(2)
      expect(body.data.listings.length).toBeLessThanOrEqual(2)
    })

    it("returns an empty page for an unknown category", async () => {
      const res = await app.inject({ method: "GET", url: "/api/listings?category=does-not-exist" })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.listings).toEqual([])
    })
  })

  describe("auth-protected mutating endpoints", () => {
    it("POST /api/listings creates a generic listing (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/listings",
        headers: { ...authHeader(), "content-type": "application/json" },
        payload: { title: "My listing", category: "transportation", price: 500 },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(body.data.title).toBe("My listing")
      expect(body.data.status).toBe("active")
      expect(typeof body.data.id).toBe("string")
    })

    it("POST /api/listings/vehicles creates a vehicle placeholder (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/listings/vehicles",
        headers: { ...authHeader(), "content-type": "application/json" },
        payload: {},
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().success).toBe(true)
    })

    it("POST /api/listings/products creates a product placeholder (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/listings/products",
        headers: { ...authHeader(), "content-type": "application/json" },
        payload: {},
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().success).toBe(true)
    })

    it("PUT /api/listings/vehicles/:id updates a vehicle placeholder", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/api/listings/vehicles/${VALID_UUID}`,
        headers: { ...authHeader(), "content-type": "application/json" },
        payload: {},
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(VALID_UUID)
    })

    it("PUT /api/listings/products/:id updates a product placeholder", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/api/listings/products/${VALID_UUID}`,
        headers: { ...authHeader(), "content-type": "application/json" },
        payload: {},
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(VALID_UUID)
    })

    it("DELETE /api/listings/vehicles/:id deletes a vehicle placeholder", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/listings/vehicles/${VALID_UUID}`,
        headers: authHeader(),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().success).toBe(true)
    })

    it("DELETE /api/listings/products/:id deletes a product placeholder", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/listings/products/${VALID_UUID}`,
        headers: authHeader(),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().success).toBe(true)
    })

    it("rejects an unauthenticated POST /api/listings/vehicles (401)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/listings/vehicles",
        headers: { "content-type": "application/json" },
        payload: {},
      })
      expect(res.statusCode).toBe(401)
    })
  })
})
