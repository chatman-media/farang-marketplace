import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"
import { createMockReply, createMockRequest } from "./helpers/fastifyMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { ServiceAssignmentController } = await import("../controllers/ServiceAssignmentController")

const sampleAssignment = {
  id: "asg-1",
  agencyServiceId: "svc-1",
  listingId: "listing-1",
  status: "active",
  notes: "note",
}

describe("ServiceAssignmentController", () => {
  let controller: InstanceType<typeof ServiceAssignmentController>

  beforeEach(() => {
    resetDb()
    controller = new ServiceAssignmentController()
  })

  describe("createAssignment", () => {
    it("returns 201 when created", async () => {
      // service.createAssignment: service lookup, insert
      configureDb([[{ id: "svc-1" }], [sampleAssignment]])
      const reply = createMockReply()
      const req = createMockRequest({ body: { agencyServiceId: "svc-1", listingId: "listing-1" } })
      await controller.createAssignment(req, reply)
      expect(reply.code).toHaveBeenCalledWith(201)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.createAssignment(createMockRequest({ body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAssignmentById", () => {
    it("returns 400 when id missing", async () => {
      const reply = createMockReply()
      await controller.getAssignmentById(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.getAssignmentById(createMockRequest({ params: { id: "missing" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 200 when found", async () => {
      configureDb([[sampleAssignment]])
      const reply = createMockReply()
      await controller.getAssignmentById(createMockRequest({ params: { id: "asg-1" } }), reply)
      expect(reply.sent.data).toEqual(sampleAssignment)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAssignmentById(createMockRequest({ params: { id: "asg-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAssignmentsByAgency", () => {
    it("returns 400 when agencyId missing", async () => {
      const reply = createMockReply()
      await controller.getAssignmentsByAgency(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns an empty placeholder list", async () => {
      const reply = createMockReply()
      await controller.getAssignmentsByAgency(createMockRequest({ params: { agencyId: "agency-1" } }), reply)
      expect(reply.sent).toEqual({ success: true, data: [] })
    })
  })

  describe("getAssignmentsByListing", () => {
    it("returns 400 when listingId missing", async () => {
      const reply = createMockReply()
      await controller.getAssignmentsByListing(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns assignments", async () => {
      configureDb([[sampleAssignment]])
      const reply = createMockReply()
      await controller.getAssignmentsByListing(createMockRequest({ params: { listingId: "listing-1" } }), reply)
      expect(reply.sent.data).toHaveLength(1)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAssignmentsByListing(createMockRequest({ params: { listingId: "listing-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateAssignmentStatus", () => {
    it("returns 400 when id missing", async () => {
      const reply = createMockReply()
      await controller.updateAssignmentStatus(createMockRequest({ params: {}, body: { status: "active" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "missing" }, body: { status: "paused" } })
      await controller.updateAssignmentStatus(req, reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 200 when updated", async () => {
      configureDb([[{ ...sampleAssignment, status: "paused" }]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "asg-1" }, body: { status: "paused", notes: "hold" } })
      await controller.updateAssignmentStatus(req, reply)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "asg-1" }, body: { status: "active" } })
      await controller.updateAssignmentStatus(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("addCustomerFeedback", () => {
    it("returns 400 when id missing", async () => {
      const reply = createMockReply()
      await controller.addCustomerFeedback(createMockRequest({ params: {}, body: { rating: 5 } }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "missing" }, body: { rating: 4, feedback: "great" } })
      await controller.addCustomerFeedback(req, reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 200 when feedback added (uses rating fallback notes)", async () => {
      configureDb([[sampleAssignment]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "asg-1" }, body: { rating: 5 } })
      await controller.addCustomerFeedback(req, reply)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "asg-1" }, body: { rating: 5, feedback: "ok" } })
      await controller.addCustomerFeedback(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("searchAssignments", () => {
    it("returns results", async () => {
      configureDb([[{ count: 1 }], [{ ...sampleAssignment, agencyName: null, serviceName: "Express" }]])
      const reply = createMockReply()
      const req = createMockRequest({ query: { status: "active", page: "1", limit: "10" } })
      await controller.searchAssignments(req, reply)
      expect(reply.sent.success).toBe(true)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.searchAssignments(createMockRequest({ query: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAssignmentStats", () => {
    it("returns 400 when agencyId missing", async () => {
      const reply = createMockReply()
      await controller.getAssignmentStats(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns stats", async () => {
      configureDb([[{ totalAssignments: 3, activeAssignments: 1, completedAssignments: 2 }]])
      const reply = createMockReply()
      await controller.getAssignmentStats(createMockRequest({ params: { agencyId: "agency-1" } }), reply)
      expect(reply.sent.data.totalAssignments).toBe(3)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAssignmentStats(createMockRequest({ params: { agencyId: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })
})
