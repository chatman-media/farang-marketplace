import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"
import { createMockReply, createMockRequest } from "./helpers/fastifyMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { FastifyAgencyController } = await import("../controllers/AgencyController")

const sampleAgency = {
  id: "agency-1",
  ownerId: "user-1",
  name: "Bangkok Movers",
  status: "active",
  commissionRate: "0.15",
}

describe("FastifyAgencyController", () => {
  let controller: InstanceType<typeof FastifyAgencyController>

  beforeEach(() => {
    resetDb()
    controller = new FastifyAgencyController()
  })

  describe("createAgency", () => {
    it("returns 201 with the created agency", async () => {
      configureDb([[sampleAgency]])
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "user-1" }, body: { name: "Bangkok Movers" } })
      await controller.createAgency(req, reply)
      expect(reply.code).toHaveBeenCalledWith(201)
      expect(reply.sent).toMatchObject({ success: true, data: sampleAgency })
    })

    it("returns 500 on service failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "user-1" }, body: {} })
      await controller.createAgency(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.sent.success).toBe(false)
    })
  })

  describe("getAgencyById", () => {
    it("returns 200 when found", async () => {
      configureDb([[sampleAgency]])
      const reply = createMockReply()
      await controller.getAgencyById(createMockRequest({ params: { id: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(200)
      expect(reply.sent.data).toEqual(sampleAgency)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.getAgencyById(createMockRequest({ params: { id: "missing" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAgencyById(createMockRequest({ params: { id: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAllAgencies", () => {
    it("returns paginated agencies", async () => {
      configureDb([[{ count: 1 }], [sampleAgency]])
      const reply = createMockReply()
      const req = createMockRequest({ query: { page: "1", limit: "10", search: "movers", status: "active" } })
      await controller.getAllAgencies(req, reply)
      expect(reply.code).toHaveBeenCalledWith(200)
      expect(reply.sent.pagination).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 })
    })

    it("uses defaults when query params are absent", async () => {
      configureDb([[{ count: 0 }], []])
      const reply = createMockReply()
      await controller.getAllAgencies(createMockRequest({ query: {} }), reply)
      expect(reply.sent.pagination.page).toBe(1)
      expect(reply.sent.pagination.limit).toBe(10)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAllAgencies(createMockRequest({ query: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateAgency", () => {
    it("returns 200 when updated", async () => {
      configureDb([[sampleAgency]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "agency-1" }, body: { name: "X" } })
      await controller.updateAgency(req, reply)
      expect(reply.code).toHaveBeenCalledWith(200)
    })

    it("returns 404 when not found", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.updateAgency(createMockRequest({ params: { id: "missing" }, body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.updateAgency(createMockRequest({ params: { id: "agency-1" }, body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("deleteAgency", () => {
    it("returns 200 when deleted", async () => {
      configureDb([[{ id: "agency-1" }]])
      const reply = createMockReply()
      await controller.deleteAgency(createMockRequest({ params: { id: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(200)
    })

    it("returns 404 when nothing deleted", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.deleteAgency(createMockRequest({ params: { id: "missing" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.deleteAgency(createMockRequest({ params: { id: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAgencyStats", () => {
    it("returns 200 with stats", async () => {
      configureDb([
        [{ totalServices: 1 }],
        [{ activeAssignments: 0, completedAssignments: 0 }],
        [{ totalCommissionEarned: 0 }],
      ])
      const reply = createMockReply()
      await controller.getAgencyStats(createMockRequest({ params: { id: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(200)
      expect(reply.sent.data.totalServices).toBe(1)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAgencyStats(createMockRequest({ params: { id: "agency-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAgenciesByUser", () => {
    it("returns the user's agency wrapped in an array", async () => {
      configureDb([[sampleAgency]])
      const reply = createMockReply()
      await controller.getAgenciesByUser(createMockRequest({ user: { id: "user-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(200)
      expect(reply.sent.data).toEqual([sampleAgency])
    })

    it("returns an empty array when the user has no agency", async () => {
      configureDb([[]])
      const reply = createMockReply()
      await controller.getAgenciesByUser(createMockRequest({ user: { id: "user-2" } }), reply)
      expect(reply.sent.data).toEqual([])
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      await controller.getAgenciesByUser(createMockRequest({ user: { id: "user-1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateAgencyStatus", () => {
    it("returns 400 for an invalid status", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "agency-1" }, body: { status: "bogus" } })
      await controller.updateAgencyStatus(req, reply)
      expect(reply.code).toHaveBeenCalledWith(400)
      expect(reply.sent.error).toBe("Invalid status")
    })

    it("returns 200 for a valid status update", async () => {
      configureDb([[{ ...sampleAgency, status: "suspended" }]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "agency-1" }, body: { status: "suspended" } })
      await controller.updateAgencyStatus(req, reply)
      expect(reply.code).toHaveBeenCalledWith(200)
    })

    it("returns 404 when the agency is missing", async () => {
      configureDb([[]])
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "missing" }, body: { status: "active" } })
      await controller.updateAgencyStatus(req, reply)
      expect(reply.code).toHaveBeenCalledWith(404)
    })

    it("returns 500 on failure", async () => {
      configureDbError()
      const reply = createMockReply()
      const req = createMockRequest({ params: { id: "agency-1" }, body: { status: "active" } })
      await controller.updateAgencyStatus(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })
})
