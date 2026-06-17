import type { FastifyInstance } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createApp } from "../app"

/**
 * Exercises the unified error handler wired in `createApp` (app.ts).
 *
 * The smoke test only proves routes mount; this test drives every branch of
 * `app.setErrorHandler` by registering throwaway routes on the *real* root app
 * that deliberately fail in different ways:
 *   - a route whose schema validation fails  → 400 "Validation Error"
 *   - a route that throws an error carrying a `statusCode` → that code
 *   - a route that throws a plain error → 500 generic handler
 *
 * Because NODE_ENV is "test" (set in vitest.config), the generic branch takes
 * the non-production message path (returns the real error message, no stack).
 */
describe("app error handler", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()

    // Route with a body schema so a bad body triggers Fastify validation.
    app.post(
      "/__test__/validation",
      {
        schema: {
          body: {
            type: "object",
            required: ["name"],
            properties: { name: { type: "string" } },
          },
        },
      },
      async () => ({ ok: true }),
    )

    // Route that throws an error decorated with a statusCode.
    app.get("/__test__/teapot", async () => {
      const err = new Error("I am a teapot") as Error & { statusCode?: number }
      err.statusCode = 418
      throw err
    })

    // Route that throws a plain error (no statusCode, no validation).
    app.get("/__test__/boom", async () => {
      throw new Error("kaboom")
    })

    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it("returns 400 with a Validation Error envelope when schema validation fails", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/__test__/validation",
      payload: {}, // missing required `name`
    })

    expect(res.statusCode).toBe(400)
    const body = res.json()
    expect(body).toMatchObject({ success: false, message: "Validation Error" })
    expect(body.details).toBeDefined()
    expect(Array.isArray(body.details)).toBe(true)
  })

  it("honours an explicit statusCode carried by the thrown error", async () => {
    const res = await app.inject({ method: "GET", url: "/__test__/teapot" })

    expect(res.statusCode).toBe(418)
    expect(res.json()).toMatchObject({
      success: false,
      message: "I am a teapot",
    })
  })

  it("falls back to 500 for a plain thrown error", async () => {
    const res = await app.inject({ method: "GET", url: "/__test__/boom" })

    expect(res.statusCode).toBe(500)
    const body = res.json()
    expect(body.success).toBe(false)
    // NODE_ENV=test → not production → real message is surfaced.
    expect(body.message).toBe("kaboom")
    // Stack is only attached in the "development" branch, not "test".
    expect(body.stack).toBeUndefined()
  })

  it("serves the documented root metadata payload", async () => {
    const res = await app.inject({ method: "GET", url: "/" })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({
      service: "Farang Marketplace API",
      version: "1.0.0",
      status: "running",
      framework: "Fastify 5.x (modular monolith)",
    })
    expect(typeof res.json().timestamp).toBe("string")
  })

  it("reports the active environment on /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({
      status: "healthy",
      service: "api",
      environment: "test",
    })
  })

  it("returns the unified 404 envelope echoing the requested path", async () => {
    const res = await app.inject({ method: "GET", url: "/no/such/endpoint" })

    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({
      success: false,
      message: "Endpoint not found",
      path: "/no/such/endpoint",
    })
  })
})
