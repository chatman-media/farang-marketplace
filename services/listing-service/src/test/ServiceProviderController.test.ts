import type { FastifyReply } from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock the service layer so the controller's validation + mapping logic is what we
// exercise, not the DB. Each method is a vi.fn we configure per-test.
const { svc } = vi.hoisted(() => ({
  svc: {
    createServiceProvider: vi.fn(),
    getServiceProviderById: vi.fn(),
    getAllServiceProviders: vi.fn(),
    searchServiceProviders: vi.fn(),
    updateServiceProvider: vi.fn(),
    deleteServiceProvider: vi.fn(),
  },
}))

vi.mock("../services/ServiceProviderService", () => ({
  // Constructable: `new ServiceProviderService()` returns our shared double.
  ServiceProviderService: vi.fn(function (this: any) {
    return svc
  }),
}))

import { ServiceProviderController } from "../controllers/ServiceProviderController"

function makeReply() {
  const reply = {
    statusCode: 200 as number,
    payload: undefined as any,
    code: vi.fn(function (this: any, c: number) {
      this.statusCode = c
      return this
    }),
    status: vi.fn(function (this: any, c: number) {
      this.statusCode = c
      return this
    }),
    send: vi.fn(function (this: any, p: any) {
      this.payload = p
      return this
    }),
  }
  return reply as unknown as FastifyReply & {
    statusCode: number
    payload: any
    code: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

const validBody = {
  businessName: "Thai Rentals",
  businessType: "company",
  description: "A scooter rental business operating in central Bangkok area",
  services: [{ name: "Scooter Rental", category: "transportation", price: 300, currency: "THB", priceType: "daily" }],
  contactInfo: { phone: "+66812345678", email: "owner@rentals.com" },
  location: { address: "123 Sukhumvit Road", city: "Bangkok", region: "Bangkok", country: "Thailand" },
}

const user = { id: "owner-1", email: "owner@rentals.com", role: "user", verified: true }

describe("ServiceProviderController", () => {
  let controller: ServiceProviderController

  beforeEach(() => {
    controller = new ServiceProviderController()
    for (const fn of Object.values(svc)) (fn as ReturnType<typeof vi.fn>).mockReset()
  })

  afterEach(() => vi.clearAllMocks())

  describe("createServiceProvider", () => {
    it("creates and returns 201 with the new provider", async () => {
      svc.createServiceProvider.mockResolvedValue({ id: "sp-1" })
      const reply = makeReply()

      await controller.createServiceProvider({ body: validBody, user } as any, reply)

      expect(reply.code).toHaveBeenCalledWith(201)
      expect(reply.payload.success).toBe(true)
      expect(reply.payload.data).toEqual({ id: "sp-1" })
      // Owner id and derived providerType passed to the service.
      const arg = svc.createServiceProvider.mock.calls[0][0]
      expect(arg.ownerId).toBe("owner-1")
      expect(arg.providerType).toBe("company")
      expect(arg.serviceCapabilities).toEqual(["transportation"])
    })

    it("derives providerType=individual and a default businessName", async () => {
      svc.createServiceProvider.mockResolvedValue({ id: "sp-2" })
      const reply = makeReply()
      const { businessName, ...noName } = validBody

      await controller.createServiceProvider({ body: { ...noName, businessType: "individual" }, user } as any, reply)

      const arg = svc.createServiceProvider.mock.calls[0][0]
      expect(arg.providerType).toBe("individual")
      expect(arg.businessName).toBe("owner@rentals.com Service Provider")
    })

    it("returns 401 when unauthenticated", async () => {
      const reply = makeReply()
      await controller.createServiceProvider({ body: validBody, user: undefined } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(401)
      expect(svc.createServiceProvider).not.toHaveBeenCalled()
    })

    it("returns 400 on Zod validation failure (description too short)", async () => {
      const reply = makeReply()
      await controller.createServiceProvider({ body: { ...validBody, description: "short" }, user } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(400)
      expect(reply.payload.message).toBe("Validation error")
      expect(Array.isArray(reply.payload.errors)).toBe(true)
    })

    it("returns 500 when the service throws", async () => {
      svc.createServiceProvider.mockRejectedValue(new Error("db error"))
      const reply = makeReply()
      await controller.createServiceProvider({ body: validBody, user } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to create service provider")
    })
  })

  describe("getServiceProvider", () => {
    it("returns the provider when found", async () => {
      svc.getServiceProviderById.mockResolvedValue({ id: "sp-1" })
      const reply = makeReply()
      await controller.getServiceProvider({ params: { id: "sp-1" } } as any, reply)
      expect(reply.payload.success).toBe(true)
      expect(reply.payload.data).toEqual({ id: "sp-1" })
    })

    it("returns 404 when not found", async () => {
      svc.getServiceProviderById.mockResolvedValue(null)
      const reply = makeReply()
      await controller.getServiceProvider({ params: { id: "missing" } } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 500 when the service throws", async () => {
      svc.getServiceProviderById.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.getServiceProvider({ params: { id: "sp-1" } } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAllServiceProviders", () => {
    it("returns providers with defaults when no query supplied", async () => {
      svc.getAllServiceProviders.mockResolvedValue({ providers: [], total: 0 })
      const reply = makeReply()
      await controller.getAllServiceProviders({ query: undefined } as any, reply)
      expect(svc.getAllServiceProviders).toHaveBeenCalledWith(1, 20, "rating", "desc")
      expect(reply.payload.success).toBe(true)
    })

    it("passes through provided pagination/sort", async () => {
      svc.getAllServiceProviders.mockResolvedValue({ providers: [], total: 0 })
      const reply = makeReply()
      await controller.getAllServiceProviders(
        { query: { page: 2, limit: 5, sortBy: "created_at", sortOrder: "asc" } } as any,
        reply,
      )
      expect(svc.getAllServiceProviders).toHaveBeenCalledWith(2, 5, "created_at", "asc")
    })

    it("returns 500 on service error", async () => {
      svc.getAllServiceProviders.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.getAllServiceProviders({ query: {} } as any, reply)
      expect(reply.status).toHaveBeenCalledWith(500)
    })
  })

  describe("searchServiceProviders", () => {
    it("validates query and returns paginated results", async () => {
      svc.searchServiceProviders.mockResolvedValue({ providers: [{ id: "sp-1" }], total: 1 })
      const reply = makeReply()
      await controller.searchServiceProviders(
        { query: { category: "transportation", priceRange: { min: 100, max: 500 }, page: 1, limit: 20 } } as any,
        reply,
      )
      expect(reply.payload.success).toBe(true)
      expect(reply.payload.pagination.total).toBe(1)
      expect(reply.payload.pagination.totalPages).toBe(1)
      const [filters] = svc.searchServiceProviders.mock.calls[0]
      expect(filters.serviceTypes).toEqual(["transportation"])
      expect(filters.priceRange).toEqual({ min: 100, max: 500, currency: "THB" })
    })

    it("returns 400 on invalid query (rating out of range)", async () => {
      const reply = makeReply()
      await controller.searchServiceProviders({ query: { rating: 99 } } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(400)
      expect(reply.payload.message).toBe("Validation error")
    })

    it("returns 500 when the service throws", async () => {
      svc.searchServiceProviders.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.searchServiceProviders({ query: {} } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateServiceProvider", () => {
    it("updates and returns the provider", async () => {
      svc.updateServiceProvider.mockResolvedValue({ id: "sp-1", businessName: "New Name" })
      const reply = makeReply()
      await controller.updateServiceProvider(
        { params: { id: "sp-1" }, body: { businessName: "New Name", services: validBody.services }, user } as any,
        reply,
      )
      expect(reply.payload.success).toBe(true)
      const [id, updateData, ownerId] = svc.updateServiceProvider.mock.calls[0]
      expect(id).toBe("sp-1")
      expect(ownerId).toBe("owner-1")
      expect(updateData.businessName).toBe("New Name")
      expect(updateData.serviceCapabilities).toEqual(["transportation"])
      expect(updateData.pricing.baseRate).toBe(300)
    })

    it("returns 401 when unauthenticated", async () => {
      const reply = makeReply()
      await controller.updateServiceProvider(
        { params: { id: "sp-1" }, body: { businessName: "X" }, user: undefined } as any,
        reply,
      )
      expect(reply.code).toHaveBeenCalledWith(401)
    })

    it("returns 404 when the service reports not found / access denied", async () => {
      svc.updateServiceProvider.mockResolvedValue(null)
      const reply = makeReply()
      await controller.updateServiceProvider(
        { params: { id: "sp-1" }, body: { businessName: "X" }, user } as any,
        reply,
      )
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 400 on invalid body", async () => {
      const reply = makeReply()
      await controller.updateServiceProvider(
        { params: { id: "sp-1" }, body: { businessType: "not-a-type" }, user } as any,
        reply,
      )
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 500 on service error", async () => {
      svc.updateServiceProvider.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.updateServiceProvider(
        { params: { id: "sp-1" }, body: { businessName: "X" }, user } as any,
        reply,
      )
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("deleteServiceProvider", () => {
    it("deletes and returns success", async () => {
      svc.deleteServiceProvider.mockResolvedValue(true)
      const reply = makeReply()
      await controller.deleteServiceProvider({ params: { id: "sp-1" }, user } as any, reply)
      expect(reply.payload.success).toBe(true)
      expect(svc.deleteServiceProvider).toHaveBeenCalledWith("sp-1", "owner-1")
    })

    it("returns 401 when unauthenticated", async () => {
      const reply = makeReply()
      await controller.deleteServiceProvider({ params: { id: "sp-1" }, user: undefined } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(401)
    })

    it("returns 404 when not found / access denied", async () => {
      svc.deleteServiceProvider.mockResolvedValue(false)
      const reply = makeReply()
      await controller.deleteServiceProvider({ params: { id: "sp-1" }, user } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 500 on service error", async () => {
      svc.deleteServiceProvider.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.deleteServiceProvider({ params: { id: "sp-1" }, user } as any, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })
})
