import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureDb, configureDbError, resetDb, sharedDbMock } from "./helpers/dbMock"

vi.mock("@marketplace/database-schema", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, sharedDb: vi.fn(() => sharedDbMock) }
})

const { AgencyServiceService } = await import("../services/AgencyServiceService")

const sampleAgency = { id: "agency-1", name: "Bangkok Movers" }
const sampleService = {
  id: "svc-1",
  agencyId: "agency-1",
  name: "Express Delivery",
  description: "Same-day delivery",
  category: "delivery",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

describe("AgencyServiceService (unit, mocked db)", () => {
  let service: InstanceType<typeof AgencyServiceService>

  beforeEach(() => {
    resetDb()
    service = new AgencyServiceService()
  })

  describe("createService", () => {
    it("creates a service when the agency exists", async () => {
      configureDb([[sampleAgency], [sampleService]])
      const result = await service.createService({
        agencyId: "agency-1",
        name: "Express Delivery",
        description: "Same-day delivery",
        category: "delivery",
      } as never)
      expect(result).toEqual(sampleService)
    })

    it("throws when the agency does not exist", async () => {
      // First query (agency lookup) returns empty.
      configureDb([[]])
      await expect(service.createService({ agencyId: "missing" } as never)).rejects.toThrow(
        "Failed to create agency service",
      )
    })

    it("throws when the insert returns no row", async () => {
      configureDb([[sampleAgency], []])
      await expect(service.createService({ agencyId: "agency-1" } as never)).rejects.toThrow(
        "Failed to create agency service",
      )
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.createService({ agencyId: "agency-1" } as never)).rejects.toThrow(
        "Failed to create agency service",
      )
    })
  })

  describe("getServiceById", () => {
    it("returns the service when found", async () => {
      configureDb([[sampleService]])
      expect(await service.getServiceById("svc-1")).toEqual(sampleService)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.getServiceById("missing")).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getServiceById("svc-1")).rejects.toThrow("Failed to get service")
    })
  })

  describe("getServicesByAgencyId", () => {
    it("returns the agency services", async () => {
      configureDb([[sampleService]])
      expect(await service.getServicesByAgencyId("agency-1")).toHaveLength(1)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getServicesByAgencyId("agency-1")).rejects.toThrow("Failed to get services")
    })
  })

  describe("updateService", () => {
    it("returns the updated service", async () => {
      const updated = { ...sampleService, name: "Premium Delivery" }
      configureDb([[updated]])
      expect(await service.updateService("svc-1", { name: "Premium Delivery" } as never)).toEqual(updated)
    })

    it("returns null when not found", async () => {
      configureDb([[]])
      expect(await service.updateService("missing", {} as never)).toBeNull()
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.updateService("svc-1", {} as never)).rejects.toThrow("Failed to update service")
    })
  })

  describe("deleteService", () => {
    it("returns true on delete", async () => {
      configureDb([[{ id: "svc-1" }]])
      expect(await service.deleteService("svc-1")).toBe(true)
    })

    it("returns false when nothing deleted", async () => {
      configureDb([[]])
      expect(await service.deleteService("missing")).toBe(false)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.deleteService("svc-1")).rejects.toThrow("Failed to delete service")
    })
  })

  describe("searchServices", () => {
    it("returns paginated results with defaults", async () => {
      configureDb([[{ count: 1 }], [{ ...sampleService, agencyName: "Bangkok Movers" }]])
      const result = await service.searchServices()
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.services).toHaveLength(1)
      expect(result.hasMore).toBe(false)
    })

    it("applies all filters and name sort asc", async () => {
      configureDb([[{ count: 3 }], [{ ...sampleService, agencyName: "Bangkok Movers" }]])
      const result = await service.searchServices(
        { agencyId: "agency-1", category: "delivery", isActive: false, search: "express" },
        { page: 1, limit: 1, sortBy: "name", sortOrder: "asc" },
      )
      expect(result.total).toBe(3)
      expect(result.hasMore).toBe(true)
    })

    it("supports category sort desc", async () => {
      configureDb([[{ count: 2 }], [sampleService, sampleService]])
      const result = await service.searchServices({}, { sortBy: "category", sortOrder: "desc" })
      expect(result.services).toHaveLength(2)
    })

    it("defaults total to 0 when count missing", async () => {
      configureDb([[], []])
      const result = await service.searchServices()
      expect(result.total).toBe(0)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.searchServices()).rejects.toThrow("Failed to search services")
    })
  })

  describe("getServicesByCategory", () => {
    it("returns active services in a category", async () => {
      configureDb([[sampleService]])
      expect(await service.getServicesByCategory("delivery" as never)).toHaveLength(1)
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.getServicesByCategory("delivery" as never)).rejects.toThrow(
        "Failed to get services by category",
      )
    })
  })

  describe("toggleServiceStatus", () => {
    it("flips isActive from true to false", async () => {
      const toggled = { ...sampleService, isActive: false }
      // 1st query: getServiceById -> active service; 2nd: update -> toggled.
      configureDb([[sampleService], [toggled]])
      const result = await service.toggleServiceStatus("svc-1")
      expect(result?.isActive).toBe(false)
    })

    it("throws when the service is not found", async () => {
      configureDb([[]])
      await expect(service.toggleServiceStatus("missing")).rejects.toThrow("Failed to toggle service status")
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.toggleServiceStatus("svc-1")).rejects.toThrow("Failed to toggle service status")
    })
  })

  describe("getServiceStats", () => {
    it("returns default zeroed stats without touching the db", async () => {
      const stats = await service.getServiceStats("svc-1")
      expect(stats).toEqual({
        totalAssignments: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        averageRating: 0,
        totalRevenue: 0,
      })
    })
  })

  describe("bulkUpdatePrices", () => {
    it("returns the number of updated rows", async () => {
      configureDb([[{ id: "svc-1" }, { id: "svc-2" }]])
      const result = await service.bulkUpdatePrices("agency-1", 1.1)
      expect(result).toEqual({ updated: 2 })
    })

    it("wraps db errors", async () => {
      configureDbError()
      await expect(service.bulkUpdatePrices("agency-1", 1.1)).rejects.toThrow("Failed to bulk update prices")
    })
  })
})
