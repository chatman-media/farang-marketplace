import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"
import { createMockReply, createMockRequest } from "./helpers/fastifyMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { BookingIntegrationController } = await import("../controllers/BookingIntegrationController")

const baseRequest = {
  bookingId: "booking-1",
  listingId: "listing-1",
  userId: "user-1",
  serviceType: "delivery",
  requestedDate: new Date("2024-06-01T10:00:00Z"),
  location: { address: "123 Sukhumvit", city: "Bangkok" },
}

const serviceRow = { id: "svc-1", agencyId: "agency-1", name: "Express Delivery", agencyName: "Bangkok Movers" }
const activeAgency = { id: "agency-1", name: "Bangkok Movers", status: "active", commissionRate: "0.2", rating: "4" }

describe("BookingIntegrationController", () => {
  let controller: InstanceType<typeof BookingIntegrationController>

  beforeEach(() => {
    resetDb()
    controller = new BookingIntegrationController()
  })

  describe("findMatchingAgencies", () => {
    it("returns matches", async () => {
      configureDb([[{ count: 1 }], [serviceRow], [activeAgency]])
      const reply = createMockReply()
      await controller.findMatchingAgencies(createMockRequest({ body: baseRequest }), reply)
      expect(reply.sent.success).toBe(true)
      expect(reply.sent.data.total).toBe(1)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.findMatchingAgencies(createMockRequest({ body: baseRequest }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("assignServiceToAgency", () => {
    const agencyMatch = {
      agencyId: "agency-1",
      serviceId: "svc-1",
      estimatedTotal: 120,
      commissionAmount: 20,
    }

    it("returns 201 with the assignment result", async () => {
      // createAssignment: service lookup, insert
      configureDb([[{ id: "svc-1" }], [{ id: "asg-1" }]])
      const reply = createMockReply()
      const req = createMockRequest({ body: { bookingRequest: baseRequest, agencyMatch } })
      await controller.assignServiceToAgency(req, reply)
      expect(reply.code).toHaveBeenCalledWith(201)
      expect(reply.sent.data.assignmentId).toBe("asg-1")
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ body: { bookingRequest: baseRequest, agencyMatch } })
      await controller.assignServiceToAgency(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("autoAssignBestMatch", () => {
    it("returns 404 when no matches are found", async () => {
      configureDb([[{ count: 0 }], []])
      const reply = createMockReply()
      await controller.autoAssignBestMatch(createMockRequest({ body: baseRequest }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 201 when a match is assigned", async () => {
      configureDb([[{ count: 1 }], [serviceRow], [activeAgency], [{ id: "svc-1" }], [{ id: "asg-2" }]])
      const reply = createMockReply()
      await controller.autoAssignBestMatch(createMockRequest({ body: baseRequest }), reply)
      expect(reply.code).toHaveBeenCalledWith(201)
      expect(reply.sent.data.assignmentId).toBe("asg-2")
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.autoAssignBestMatch(createMockRequest({ body: baseRequest }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("calculateCommission", () => {
    it("returns 400 when assignmentId is missing", async () => {
      const reply = createMockReply()
      await controller.calculateCommission(createMockRequest({ params: {}, body: { finalPrice: 100 } }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns commission data", async () => {
      configureDb([[{ id: "asg-1", status: "active" }]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { assignmentId: "asg-1" }, body: { finalPrice: 1000 } })
      await controller.calculateCommission(req, reply)
      expect(reply.sent.data.commissionAmount).toBeCloseTo(150)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ params: { assignmentId: "asg-1" }, body: { finalPrice: 1000 } })
      await controller.calculateCommission(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAssignmentStatus", () => {
    it("returns 400 when assignmentId is missing", async () => {
      const reply = createMockReply()
      await controller.getAssignmentStatus(createMockRequest({ params: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns status data", async () => {
      configureDb([[{ id: "asg-1", status: "active", notes: "n", completedAt: null }]])
      const reply = createMockReply()
      await controller.getAssignmentStatus(createMockRequest({ params: { assignmentId: "asg-1" } }), reply)
      expect(reply.sent.data.progress).toBe(25)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAssignmentStatus(createMockRequest({ params: { assignmentId: "asg-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getServiceCategories", () => {
    it("returns the 12 service categories", async () => {
      const reply = createMockReply()
      await controller.getServiceCategories(createMockRequest(), reply)
      expect(reply.sent.success).toBe(true)
      expect(reply.sent.data).toHaveLength(12)
      expect(reply.sent.data[0].id).toBe("delivery")
    })
  })
})
