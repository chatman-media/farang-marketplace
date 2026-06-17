import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { AgencyService } = await import("../services/AgencyService")

const sampleAgency = {
  id: "agency-1",
  ownerId: "user-1",
  name: "Bangkok Movers",
  description: "Moving and delivery services",
  status: "active",
  commissionRate: "0.15",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

describe("AgencyService (unit, mocked db)", () => {
  let service: InstanceType<typeof AgencyService>

  beforeEach(() => {
    resetDb()
    service = new AgencyService()
  })

  describe("createAgency", () => {
    it("inserts and returns the created agency", async () => {
      configureDb([[sampleAgency]])
      const result = await service.createAgency({
        ownerId: "user-1",
        name: "Bangkok Movers",
        description: "Moving and delivery services",
      } as never)
      expect(result).toEqual(sampleAgency)
    })

    it("throws when insert returns no row", async () => {
      configureDb([[]])
      await expect(service.createAgency({ ownerId: "user-1" } as never)).rejects.toThrow("Failed to create agency")
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.createAgency({ ownerId: "user-1" } as never)).rejects.toThrow("Failed to create agency")
    })
  })

  describe("getAgencyById", () => {
    it("returns the agency when found", async () => {
      configureDb([[sampleAgency]])
      expect(await service.getAgencyById("agency-1")).toEqual(sampleAgency)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.getAgencyById("missing")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAgencyById("agency-1")).rejects.toThrow("Failed to get agency")
    })
  })

  describe("getAgencyByUserId", () => {
    it("returns the agency for a user", async () => {
      configureDb([[sampleAgency]])
      expect(await service.getAgencyByUserId("user-1")).toEqual(sampleAgency)
    })

    it("returns null when the user has no agency", async () => {
      configureDb([[]])
      expect(await service.getAgencyByUserId("user-2")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAgencyByUserId("user-1")).rejects.toThrow("Failed to get agency")
    })
  })

  describe("updateAgency", () => {
    it("returns the updated agency", async () => {
      const updated = { ...sampleAgency, name: "New Name" }
      configureDb([[updated]])
      expect(await service.updateAgency("agency-1", { name: "New Name" } as never)).toEqual(updated)
    })

    it("returns null when no row is updated", async () => {
      configureDb([[]])
      expect(await service.updateAgency("missing", { name: "x" } as never)).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.updateAgency("agency-1", {} as never)).rejects.toThrow("Failed to update agency")
    })
  })

  describe("deleteAgency", () => {
    it("returns true when a row was deleted", async () => {
      configureDb([[{ id: "agency-1" }]])
      expect(await service.deleteAgency("agency-1")).toBe(true)
    })

    it("returns false when nothing was deleted", async () => {
      configureDb([[]])
      expect(await service.deleteAgency("missing")).toBe(false)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.deleteAgency("agency-1")).rejects.toThrow("Failed to delete agency")
    })
  })

  describe("searchAgencies", () => {
    it("returns paginated results with defaults", async () => {
      configureDb([[{ count: 1 }], [sampleAgency]])
      const result = await service.searchAgencies()
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.agencies).toHaveLength(1)
      expect(result.hasMore).toBe(false)
    })

    it("applies status, search and commissionRate filters and name sort", async () => {
      configureDb([[{ count: 5 }], [sampleAgency]])
      const result = await service.searchAgencies(
        {
          status: "active",
          search: "movers",
          commissionRate: { min: 0.1, max: 0.3 },
        },
        { page: 1, limit: 1, sortBy: "name", sortOrder: "asc" },
      )
      expect(result.total).toBe(5)
      expect(result.hasMore).toBe(true)
    })

    it("supports commissionRate sort descending", async () => {
      configureDb([[{ count: 2 }], [sampleAgency, sampleAgency]])
      const result = await service.searchAgencies({}, { sortBy: "commissionRate", sortOrder: "desc" })
      expect(result.agencies).toHaveLength(2)
    })

    it("computes hasMore across pages", async () => {
      configureDb([[{ count: 40 }], [sampleAgency]])
      const result = await service.searchAgencies({}, { page: 2, limit: 1 })
      expect(result.hasMore).toBe(true)
      expect(result.page).toBe(2)
    })

    it("defaults total to 0 when count is missing", async () => {
      configureDb([[], []])
      const result = await service.searchAgencies()
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.searchAgencies()).rejects.toThrow("Failed to search agencies")
    })
  })

  describe("verifyAgency", () => {
    it("activates the agency", async () => {
      const verified = { ...sampleAgency, status: "active" }
      configureDb([[verified]])
      expect(await service.verifyAgency("agency-1", "looks good")).toEqual(verified)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.verifyAgency("missing")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.verifyAgency("agency-1")).rejects.toThrow("Failed to verify agency")
    })
  })

  describe("rejectAgencyVerification", () => {
    it("rejects the agency", async () => {
      const rejected = { ...sampleAgency, status: "rejected" }
      configureDb([[rejected]])
      expect(await service.rejectAgencyVerification("agency-1", "missing docs")).toEqual(rejected)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.rejectAgencyVerification("missing", "reason")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.rejectAgencyVerification("agency-1", "reason")).rejects.toThrow(
        "Failed to reject agency verification",
      )
    })
  })

  describe("updateAgencyStatus", () => {
    it("updates the status", async () => {
      const suspended = { ...sampleAgency, status: "suspended" }
      configureDb([[suspended]])
      expect(await service.updateAgencyStatus("agency-1", "suspended")).toEqual(suspended)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.updateAgencyStatus("missing", "active")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.updateAgencyStatus("agency-1", "active")).rejects.toThrow("Failed to update agency status")
    })
  })

  describe("getAgencyStats", () => {
    it("aggregates services, assignments and commission", async () => {
      configureDb([
        [{ totalServices: 3 }],
        [{ activeAssignments: 2, completedAssignments: 5 }],
        [{ totalCommissionEarned: 1250 }],
      ])
      const stats = await service.getAgencyStats("agency-1")
      expect(stats).toEqual({
        totalServices: 3,
        activeAssignments: 2,
        completedAssignments: 5,
        totalCommissionEarned: 1250,
        averageRating: 0,
      })
    })

    it("defaults missing aggregates to zero", async () => {
      configureDb([[], [], []])
      const stats = await service.getAgencyStats("agency-1")
      expect(stats).toEqual({
        totalServices: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        totalCommissionEarned: 0,
        averageRating: 0,
      })
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAgencyStats("agency-1")).rejects.toThrow("Failed to get agency statistics")
    })
  })

  it("mocked sharedDb is wired in", () => {
    expect(sharedDbMock.select).toBeDefined()
  })
})
