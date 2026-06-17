import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { BookingIntegrationService } = await import("../services/BookingIntegrationService")

const baseRequest = {
  bookingId: "booking-1",
  listingId: "listing-1",
  userId: "user-1",
  serviceType: "delivery",
  requestedDate: new Date("2024-06-01T10:00:00Z"),
  location: { address: "123 Sukhumvit", city: "Bangkok" },
}

const activeAgency = {
  id: "agency-1",
  name: "Bangkok Movers",
  status: "active",
  commissionRate: "0.2",
  rating: "4",
}

const serviceRow = {
  id: "svc-1",
  agencyId: "agency-1",
  name: "Express Delivery",
  agencyName: "Bangkok Movers",
}

describe("BookingIntegrationService (unit, mocked db)", () => {
  let service: InstanceType<typeof BookingIntegrationService>

  beforeEach(() => {
    resetDb()
    service = new BookingIntegrationService()
  })

  describe("findMatchingAgencies", () => {
    it("returns matches for active agencies", async () => {
      // searchServices: count, list ; then getAgencyById for svc-1
      configureDb([[{ count: 1 }], [serviceRow], [activeAgency]])
      const matches = await service.findMatchingAgencies(baseRequest)
      expect(matches).toHaveLength(1)
      const match = matches[0]
      expect(match.agencyId).toBe("agency-1")
      expect(match.commissionRate).toBe(0.2)
      expect(match.commissionAmount).toBeCloseTo(20) // 100 * 0.2
      expect(match.estimatedTotal).toBeCloseTo(120)
      expect(typeof match.matchScore).toBe("number")
    })

    it("skips services without an agency name", async () => {
      configureDb([[{ count: 1 }], [{ ...serviceRow, agencyName: null }]])
      const matches = await service.findMatchingAgencies(baseRequest)
      expect(matches).toHaveLength(0)
    })

    it("skips when the agency is missing or inactive", async () => {
      configureDb([[{ count: 1 }], [serviceRow], [{ ...activeAgency, status: "suspended" }]])
      const matches = await service.findMatchingAgencies(baseRequest)
      expect(matches).toHaveLength(0)
    })

    it("filters out matches outside the budget range", async () => {
      // estimatedTotal will be 120, budget caps at 50 -> excluded
      configureDb([[{ count: 1 }], [serviceRow], [activeAgency]])
      const matches = await service.findMatchingAgencies({
        ...baseRequest,
        budget: { min: 0, max: 50, currency: "THB" },
      })
      expect(matches).toHaveLength(0)
    })

    it("includes matches within the budget and scores them", async () => {
      configureDb([[{ count: 1 }], [serviceRow], [activeAgency]])
      const matches = await service.findMatchingAgencies({
        ...baseRequest,
        budget: { min: 100, max: 200, currency: "THB" },
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].matchScore).toBeGreaterThan(0)
    })

    it("sorts matches by descending match score", async () => {
      const svc2 = { ...serviceRow, id: "svc-2" }
      const agency2 = { ...activeAgency, id: "agency-2", rating: "5" }
      // count, list(2 services), agency for svc-1, agency for svc-2
      configureDb([[{ count: 2 }], [serviceRow, svc2], [activeAgency], [agency2]])
      const matches = await service.findMatchingAgencies(baseRequest)
      expect(matches).toHaveLength(2)
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[1].matchScore)
    })

    it("wraps errors from the underlying search", async () => {
      configureDbError()
      await expect(service.findMatchingAgencies(baseRequest)).rejects.toThrow("Failed to find matching agencies")
    })
  })

  describe("assignServiceToAgency", () => {
    const match = {
      agencyId: "agency-1",
      agencyName: "Bangkok Movers",
      serviceId: "svc-1",
      serviceName: "Express Delivery",
      basePrice: 100,
      commissionRate: 0.2,
      estimatedTotal: 120,
      commissionAmount: 20,
      rating: 0,
      responseTime: 2,
      availability: true,
      matchScore: 80,
    }

    it("creates an assignment and returns the result", async () => {
      // createAssignment: service lookup, insert
      configureDb([[{ id: "svc-1" }], [{ id: "asg-1" }]])
      const result = await service.assignServiceToAgency(baseRequest, match)
      expect(result.assignmentId).toBe("asg-1")
      expect(result.agencyId).toBe("agency-1")
      expect(result.status).toBe("pending")
      expect(result.estimatedCompletion).toBeInstanceOf(Date)
      // estimatedCompletion is +24h from requestedDate
      expect(result.estimatedCompletion!.getTime()).toBe(baseRequest.requestedDate.getTime() + 24 * 60 * 60 * 1000)
    })

    it("wraps errors when assignment creation fails", async () => {
      configureDbError()
      await expect(service.assignServiceToAgency(baseRequest, match)).rejects.toThrow(
        "Failed to assign service to agency",
      )
    })
  })

  describe("autoAssignBestMatch", () => {
    it("returns null when there are no matches", async () => {
      configureDb([[{ count: 0 }], []])
      const result = await service.autoAssignBestMatch(baseRequest)
      expect(result).toBeNull()
    })

    it("assigns the best match when matches exist", async () => {
      // findMatchingAgencies: count, list, agency ; then assignServiceToAgency: service lookup, insert
      configureDb([[{ count: 1 }], [serviceRow], [activeAgency], [{ id: "svc-1" }], [{ id: "asg-9" }]])
      const result = await service.autoAssignBestMatch(baseRequest)
      expect(result).not.toBeNull()
      expect(result?.assignmentId).toBe("asg-9")
    })

    it("wraps errors", async () => {
      configureDbError()
      await expect(service.autoAssignBestMatch(baseRequest)).rejects.toThrow("Failed to auto-assign service")
    })
  })

  describe("calculateCommission", () => {
    it("computes commission, earnings and platform fee", async () => {
      configureDb([[{ id: "asg-1", status: "active" }]])
      const result = await service.calculateCommission("asg-1", 1000)
      expect(result.commissionAmount).toBeCloseTo(150) // 15%
      expect(result.agencyEarnings).toBeCloseTo(850)
      expect(result.platformFee).toBeCloseTo(15) // 10% of commission
    })

    it("throws when the assignment is not found", async () => {
      configureDb([[]])
      await expect(service.calculateCommission("missing", 1000)).rejects.toThrow("Failed to calculate commission")
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.calculateCommission("asg-1", 1000)).rejects.toThrow("Failed to calculate commission")
    })
  })

  describe("getAssignmentStatus", () => {
    it("reports active status with 25% progress", async () => {
      configureDb([[{ id: "asg-1", status: "active", notes: "in progress", completedAt: null }]])
      const status = await service.getAssignmentStatus("asg-1")
      expect(status.status).toBe("active")
      expect(status.progress).toBe(25)
      expect(status.agencyNotes).toBe("in progress")
    })

    it("reports paused status with 50% progress", async () => {
      configureDb([[{ id: "asg-1", status: "paused", notes: null, completedAt: null }]])
      const status = await service.getAssignmentStatus("asg-1")
      expect(status.progress).toBe(50)
      expect(status.agencyNotes).toBeUndefined()
    })

    it("reports completed status with 100% progress", async () => {
      const completedAt = new Date("2024-06-02")
      configureDb([[{ id: "asg-1", status: "completed", notes: "done", completedAt }]])
      const status = await service.getAssignmentStatus("asg-1")
      expect(status.progress).toBe(100)
      expect(status.estimatedCompletion).toEqual(completedAt)
      expect(status.actualCompletion).toEqual(completedAt)
    })

    it("reports cancelled status with 0% progress", async () => {
      configureDb([[{ id: "asg-1", status: "cancelled", notes: null, completedAt: null }]])
      const status = await service.getAssignmentStatus("asg-1")
      expect(status.progress).toBe(0)
    })

    it("throws when the assignment is not found", async () => {
      configureDb([[]])
      await expect(service.getAssignmentStatus("missing")).rejects.toThrow("Failed to get assignment status")
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAssignmentStatus("asg-1")).rejects.toThrow("Failed to get assignment status")
    })
  })
})
