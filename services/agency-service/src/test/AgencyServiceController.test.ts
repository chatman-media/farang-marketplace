import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"
import { createMockReply, createMockRequest } from "./helpers/fastifyMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { AgencyServiceController } = await import("../controllers/AgencyServiceController")

const sampleService = {
  id: "svc-1",
  agencyId: "agency-1",
  name: "Express Delivery",
  category: "delivery",
  isActive: true,
}

describe("AgencyServiceController", () => {
  let controller: InstanceType<typeof AgencyServiceController>

  beforeEach(() => {
    resetDb()
    controller = new AgencyServiceController()
  })

  describe("createService", () => {
    it("returns 201 when created", async () => {
      // service.createService: agency lookup, insert
      configureDb([[{ id: "agency-1" }], [sampleService]])
      const reply = createMockReply()
      const req = createMockRequest({ user: { agencyId: "agency-1" }, body: { name: "Express Delivery" } })
      await controller.createService(req, reply)
      expect(reply.code).toHaveBeenCalledWith(201)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.createService(createMockRequest({ user: { agencyId: "agency-1" }, body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getServiceById", () => {
    it("returns 400 when id is missing", async () => {
      const reply = createMockReply()
      await controller.getServiceById(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.getServiceById(createMockRequest({ params: { id: "missing" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 200 when found", async () => {
      configureDb([[sampleService]])
      const reply = createMockReply()
      await controller.getServiceById(createMockRequest({ params: { id: "svc-1" } }), reply)
      expect(reply.sent.data).toEqual(sampleService)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getServiceById(createMockRequest({ params: { id: "svc-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getServicesByAgency", () => {
    it("returns 400 when agencyId is missing", async () => {
      const reply = createMockReply()
      await controller.getServicesByAgency(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns services list", async () => {
      configureDb([[sampleService]])
      const reply = createMockReply()
      await controller.getServicesByAgency(createMockRequest({ params: { agencyId: "agency-1" } }), reply)
      expect(reply.sent.data).toHaveLength(1)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getServicesByAgency(createMockRequest({ params: { agencyId: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateService", () => {
    it("returns 400 when id is missing", async () => {
      const reply = createMockReply()
      await controller.updateService(createMockRequest({ params: {}, body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.updateService(createMockRequest({ params: { id: "missing" }, body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 200 when updated", async () => {
      configureDb([[sampleService]])
      const reply = createMockReply()
      await controller.updateService(createMockRequest({ params: { id: "svc-1" }, body: { name: "x" } }), reply)
      expect(reply.code).not.toHaveBeenCalledWith(404)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.updateService(createMockRequest({ params: { id: "svc-1" }, body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("deleteService", () => {
    it("returns 400 when id is missing", async () => {
      const reply = createMockReply()
      await controller.deleteService(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 404 when nothing deleted", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.deleteService(createMockRequest({ params: { id: "missing" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns success when deleted", async () => {
      configureDb([[{ id: "svc-1" }]])
      const reply = createMockReply()
      await controller.deleteService(createMockRequest({ params: { id: "svc-1" } }), reply)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.deleteService(createMockRequest({ params: { id: "svc-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("searchServices", () => {
    it("returns search results with parsed numeric params", async () => {
      configureDb([[{ count: 1 }], [{ ...sampleService, agencyName: "A" }]])
      const reply = createMockReply()
      const req = createMockRequest({
        query: { query: "express", category: "delivery", minPrice: "10", maxPrice: "100", page: "1", limit: "5" },
      })
      await controller.searchServices(req, reply)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.searchServices(createMockRequest({ query: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("toggleServiceStatus", () => {
    it("returns 400 when id is missing", async () => {
      const reply = createMockReply()
      await controller.toggleServiceStatus(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 200 when toggled", async () => {
      // getServiceById then update
      configureDb([[sampleService], [{ ...sampleService, isActive: false }]])
      const reply = createMockReply()
      await controller.toggleServiceStatus(createMockRequest({ params: { id: "svc-1" } }), reply)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 when the service is not found (service throws)", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.toggleServiceStatus(createMockRequest({ params: { id: "missing" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("bulkUpdatePrices", () => {
    it("returns 400 when agencyId is missing", async () => {
      const reply = createMockReply()
      await controller.bulkUpdatePrices(createMockRequest({ params: {}, body: { priceMultiplier: 1.1 } }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns success with updated count", async () => {
      configureDb([[{ id: "svc-1" }, { id: "svc-2" }]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { agencyId: "agency-1" }, body: { priceMultiplier: 1.2 } })
      await controller.bulkUpdatePrices(req, reply)
      expect(reply.sent.data).toEqual({ updated: 2 })
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ params: { agencyId: "agency-1" }, body: { priceMultiplier: 1.2 } })
      await controller.bulkUpdatePrices(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })
})
