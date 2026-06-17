import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { ServiceAssignmentService } = await import("../services/ServiceAssignmentService")

const sampleService = { id: "svc-1", name: "Express Delivery" }
const sampleAssignment = {
  id: "asg-1",
  agencyServiceId: "svc-1",
  listingId: "listing-1",
  status: "active",
  notes: "first booking",
  assignedAt: new Date("2024-01-01"),
  completedAt: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

describe("ServiceAssignmentService (unit, mocked db)", () => {
  let service: InstanceType<typeof ServiceAssignmentService>

  beforeEach(() => {
    resetDb()
    service = new ServiceAssignmentService()
  })

  describe("createAssignment", () => {
    it("creates an assignment when the service exists", async () => {
      configureDb([[sampleService], [sampleAssignment]])
      const result = await service.createAssignment({
        agencyServiceId: "svc-1",
        listingId: "listing-1",
        notes: "first booking",
      })
      expect(result).toEqual(sampleAssignment)
    })

    it("throws when the service does not exist", async () => {
      configureDb([[]])
      await expect(service.createAssignment({ agencyServiceId: "missing", listingId: "listing-1" })).rejects.toThrow(
        "Failed to create assignment",
      )
    })

    it("throws when the insert returns no row", async () => {
      configureDb([[sampleService], []])
      await expect(service.createAssignment({ agencyServiceId: "svc-1", listingId: "listing-1" })).rejects.toThrow(
        "Failed to create assignment",
      )
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.createAssignment({ agencyServiceId: "svc-1", listingId: "listing-1" })).rejects.toThrow(
        "Failed to create assignment",
      )
    })
  })

  describe("getAssignmentById", () => {
    it("returns the assignment when found", async () => {
      configureDb([[sampleAssignment]])
      expect(await service.getAssignmentById("asg-1")).toEqual(sampleAssignment)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.getAssignmentById("missing")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAssignmentById("asg-1")).rejects.toThrow("Failed to get assignment")
    })
  })

  describe("getAssignmentsByAgencyServiceId", () => {
    it("returns assignments", async () => {
      configureDb([[sampleAssignment]])
      expect(await service.getAssignmentsByAgencyServiceId("svc-1")).toHaveLength(1)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAssignmentsByAgencyServiceId("svc-1")).rejects.toThrow("Failed to get assignments")
    })
  })

  describe("getAssignmentsByListingId", () => {
    it("returns assignments", async () => {
      configureDb([[sampleAssignment]])
      expect(await service.getAssignmentsByListingId("listing-1")).toHaveLength(1)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAssignmentsByListingId("listing-1")).rejects.toThrow("Failed to get assignments")
    })
  })

  describe("updateAssignmentStatus", () => {
    it("updates status without notes", async () => {
      const updated = { ...sampleAssignment, status: "paused" }
      configureDb([[updated]])
      expect(await service.updateAssignmentStatus("asg-1", "paused")).toEqual(updated)
    })

    it("sets agencyNotes when notes are provided", async () => {
      const updated = { ...sampleAssignment, status: "paused" }
      configureDb([[updated]])
      expect(await service.updateAssignmentStatus("asg-1", "paused", "on hold")).toEqual(updated)
    })

    it("sets completedAt when status is completed", async () => {
      const completed = { ...sampleAssignment, status: "completed", completedAt: new Date() }
      configureDb([[completed]])
      const result = await service.updateAssignmentStatus("asg-1", "completed", "done")
      expect(result?.status).toBe("completed")
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.updateAssignmentStatus("missing", "active")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.updateAssignmentStatus("asg-1", "active")).rejects.toThrow(
        "Failed to update assignment status",
      )
    })
  })

  describe("addNotes", () => {
    it("returns the updated assignment", async () => {
      const updated = { ...sampleAssignment, notes: "new note" }
      configureDb([[updated]])
      expect(await service.addNotes("asg-1", "new note")).toEqual(updated)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.addNotes("missing", "note")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.addNotes("asg-1", "note")).rejects.toThrow("Failed to add notes")
    })
  })

  describe("searchAssignments", () => {
    it("returns paginated results with defaults", async () => {
      configureDb([[{ count: 1 }], [{ ...sampleAssignment, agencyName: null, serviceName: "Express" }]])
      const result = await service.searchAssignments()
      expect(result.total).toBe(1)
      expect(result.assignments).toHaveLength(1)
      expect(result.hasMore).toBe(false)
    })

    it("applies all filters including dateRange and completedAt sort", async () => {
      configureDb([[{ count: 5 }], [{ ...sampleAssignment, agencyName: null, serviceName: "Express" }]])
      const result = await service.searchAssignments(
        {
          agencyServiceId: "svc-1",
          listingId: "listing-1",
          status: "active",
          dateRange: { start: new Date("2024-01-01"), end: new Date("2024-12-31") },
        },
        { page: 1, limit: 1, sortBy: "completedAt", sortOrder: "asc" },
      )
      expect(result.total).toBe(5)
      expect(result.hasMore).toBe(true)
    })

    it("supports assignedAt sort asc", async () => {
      configureDb([[{ count: 2 }], [sampleAssignment, sampleAssignment]])
      const result = await service.searchAssignments({}, { sortBy: "assignedAt", sortOrder: "asc" })
      expect(result.assignments).toHaveLength(2)
    })

    it("defaults total to 0 when count missing", async () => {
      configureDb([[], []])
      const result = await service.searchAssignments()
      expect(result.total).toBe(0)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.searchAssignments()).rejects.toThrow("Failed to search assignments")
    })
  })

  describe("getAssignmentStats", () => {
    it("returns aggregated counts", async () => {
      configureDb([[{ totalAssignments: 10, activeAssignments: 4, completedAssignments: 6 }]])
      const stats = await service.getAssignmentStats()
      expect(stats).toEqual({
        totalAssignments: 10,
        activeAssignments: 4,
        completedAssignments: 6,
      })
    })

    it("defaults to zero when no row returned", async () => {
      configureDb([[]])
      const stats = await service.getAssignmentStats()
      expect(stats).toEqual({
        totalAssignments: 0,
        activeAssignments: 0,
        completedAssignments: 0,
      })
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getAssignmentStats()).rejects.toThrow("Failed to get assignment statistics")
    })
  })
})
