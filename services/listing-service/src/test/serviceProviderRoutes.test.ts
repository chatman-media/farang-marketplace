import Fastify, { type FastifyInstance } from "fastify"
import jwt from "jsonwebtoken"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

// Mount the serviceProviders route plugin in isolation with a stub controller, so
// we cover the route definitions, schema validation and auth preHandlers without
// touching the DB. The controller is injected via plugin options.
process.env.JWT_SECRET = "sp-routes-secret"

import serviceProviderRoutes from "../routes/serviceProviders"

const VALID_UUID = "22222222-2222-2222-2222-222222222222"

function token(): string {
  return jwt.sign({ id: "owner-1", email: "o@test.local", role: "user", verified: true }, "sp-routes-secret")
}

// Stub controller: every handler just records the call and replies 200/201.
function makeStubController() {
  return {
    createServiceProvider: vi.fn(async (_req: any, reply: any) =>
      reply.code(201).send({ success: true, data: { id: "new" } }),
    ),
    getServiceProvider: vi.fn(async (_req: any, reply: any) => reply.send({ success: true, data: { id: VALID_UUID } })),
    getAllServiceProviders: vi.fn(async (_req: any, reply: any) => reply.send({ success: true, data: [] })),
    searchServiceProviders: vi.fn(async (_req: any, reply: any) => reply.send({ success: true, data: [] })),
    updateServiceProvider: vi.fn(async (_req: any, reply: any) =>
      reply.send({ success: true, data: { id: VALID_UUID } }),
    ),
    deleteServiceProvider: vi.fn(async (_req: any, reply: any) => reply.send({ success: true })),
  }
}

describe("serviceProviders routes (isolated plugin)", () => {
  let app: FastifyInstance
  let controller: ReturnType<typeof makeStubController>

  beforeAll(async () => {
    controller = makeStubController()
    app = Fastify()
    await app.register(serviceProviderRoutes as any, {
      prefix: "/api/service-providers",
      serviceProviderController: controller,
    })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it("GET / (list) works without auth and calls the controller", async () => {
    const res = await app.inject({ method: "GET", url: "/api/service-providers" })
    expect(res.statusCode).toBe(200)
    expect(controller.getAllServiceProviders).toHaveBeenCalled()
  })

  it("GET /search works without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/service-providers/search?query=tour" })
    expect(res.statusCode).toBe(200)
    expect(controller.searchServiceProviders).toHaveBeenCalled()
  })

  it("GET /:id with a valid uuid calls the controller", async () => {
    const res = await app.inject({ method: "GET", url: `/api/service-providers/${VALID_UUID}` })
    expect(res.statusCode).toBe(200)
    expect(controller.getServiceProvider).toHaveBeenCalled()
  })

  it("GET /:id with an invalid uuid is rejected by schema (400)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/service-providers/not-a-uuid" })
    expect(res.statusCode).toBe(400)
  })

  it("POST / requires authentication (401 without token)", async () => {
    // Body must be schema-valid, because Fastify runs schema validation BEFORE the
    // auth preHandler — an invalid body would 400 first and never reach auth.
    const res = await app.inject({
      method: "POST",
      url: "/api/service-providers",
      headers: { "content-type": "application/json" },
      payload: {
        providerType: "company",
        businessName: "Thai Rentals",
        description: "Scooter rentals",
        serviceCapabilities: ["transportation"],
        primaryLocation: { address: "123 Rd", city: "Bangkok", province: "Bangkok" },
        contactInfo: { phone: "+66812345678" },
      },
    })
    expect(res.statusCode).toBe(401)
    expect(controller.createServiceProvider).not.toHaveBeenCalled()
  })

  it("POST / with auth + valid body reaches the controller (201)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/service-providers",
      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
      payload: {
        providerType: "company",
        businessName: "Thai Rentals",
        description: "Scooter rentals",
        serviceCapabilities: ["transportation"],
        primaryLocation: { address: "123 Rd", city: "Bangkok", province: "Bangkok" },
        contactInfo: { phone: "+66812345678" },
      },
    })
    expect(res.statusCode).toBe(201)
    expect(controller.createServiceProvider).toHaveBeenCalled()
  })

  it("POST / with auth but missing required fields is rejected by schema (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/service-providers",
      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
      payload: { providerType: "company" },
    })
    expect(res.statusCode).toBe(400)
  })

  it("PATCH /:id requires authentication (401)", async () => {
    // businessName must be schema-valid (min length 2) to reach the auth hook.
    const res = await app.inject({
      method: "PATCH",
      url: `/api/service-providers/${VALID_UUID}`,
      headers: { "content-type": "application/json" },
      payload: { businessName: "Valid Name" },
    })
    expect(res.statusCode).toBe(401)
  })

  it("PATCH /:id with auth reaches the controller", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/service-providers/${VALID_UUID}`,
      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
      payload: { businessName: "New Name" },
    })
    expect(res.statusCode).toBe(200)
    expect(controller.updateServiceProvider).toHaveBeenCalled()
  })

  it("DELETE /:id requires authentication (401)", async () => {
    const res = await app.inject({ method: "DELETE", url: `/api/service-providers/${VALID_UUID}` })
    expect(res.statusCode).toBe(401)
  })

  it("DELETE /:id with auth reaches the controller", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/service-providers/${VALID_UUID}`,
      headers: { authorization: `Bearer ${token()}` },
    })
    expect(res.statusCode).toBe(200)
    expect(controller.deleteServiceProvider).toHaveBeenCalled()
  })
})
