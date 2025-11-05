// biome-ignore lint/suspicious/noThenProperty: Mocking database query builder requires then property
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AvailabilityService } from "../services/AvailabilityService"

// Mock database connection
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  then: vi.fn((callback) => Promise.resolve(callback([]))),
}

vi.mock("../db/connection", () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
    insert: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
    delete: vi.fn(() => mockQueryBuilder),
  },
  schema: {
    availabilityConflicts: {},
    bookings: {},
    serviceBookings: {},
  },
}))

describe("AvailabilityService", () => {
  let availabilityService: AvailabilityService

  beforeEach(() => {
    vi.clearAllMocks()
    availabilityService = new AvailabilityService()
  })

  describe("checkAvailability", () => {
    it("should return true when no conflicts exist", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      const result = await availabilityService.checkAvailability(
        "listing-123",
        new Date("2024-03-01"),
        new Date("2024-03-03"),
      )

      expect(result).toBe(true)
    })

    it("should return false when conflicts exist", async () => {
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              id: "conflict-1",
              listingId: "listing-123",
              startDate: new Date("2024-03-02"),
              endDate: new Date("2024-03-04"),
              conflictType: "booking",
            },
          ]),
        ),
      )

      const result = await availabilityService.checkAvailability(
        "listing-123",
        new Date("2024-03-01"),
        new Date("2024-03-03"),
      )

      expect(result).toBe(false)
    })

    it("should handle single-day availability check", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      const result = await availabilityService.checkAvailability("listing-123", new Date("2024-03-01"))

      expect(result).toBe(true)
    })
  })

  describe("checkServiceAvailability", () => {
    it("should return true when service provider is available", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      const result = await availabilityService.checkServiceAvailability("provider-123", new Date("2024-03-15T10:00"), {
        value: 120,
        unit: "minutes",
      })

      expect(result).toBe(true)
    })

    it("should return false when service provider has conflicts", async () => {
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              serviceBookings: {
                id: "service-1",
                providerId: "provider-123",
                scheduledDate: new Date("2024-03-15T10:00"),
              },
              bookings: {
                status: "confirmed",
              },
            },
          ]),
        ),
      )

      const result = await availabilityService.checkServiceAvailability("provider-123", new Date("2024-03-15T10:00"), {
        value: 120,
        unit: "minutes",
      })

      expect(result).toBe(false)
    })
  })

  describe("getAvailabilityCalendar", () => {
    it("should return availability calendar for date range", async () => {
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              id: "conflict-1",
              listingId: "listing-123",
              startDate: new Date("2024-03-02"),
              endDate: new Date("2024-03-02"),
              conflictType: "booking",
            },
          ]),
        ),
      )

      const result = await availabilityService.getAvailabilityCalendar(
        "listing-123",
        new Date("2024-03-01"),
        new Date("2024-03-03"),
      )

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe("2024-03-01")
      expect(result[0].available).toBe(true)
      expect(result[1].date).toBe("2024-03-02")
      expect(result[1].available).toBe(false)
      expect(result[2].date).toBe("2024-03-03")
      expect(result[2].available).toBe(true)
    })

    it("should return all available when no conflicts", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      const result = await availabilityService.getAvailabilityCalendar(
        "listing-123",
        new Date("2024-03-01"),
        new Date("2024-03-02"),
      )

      expect(result).toHaveLength(2)
      expect(result.every((day) => day.available)).toBe(true)
    })
  })

  describe("getServiceProviderAvailability", () => {
    it("should return availability with time slots", async () => {
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              service_bookings: {
                scheduledDate: new Date("2024-03-15T10:00"),
                scheduledTime: "10:00",
                duration: { value: 60, unit: "minutes" },
              },
              bookings: {
                id: "booking-1",
                status: "confirmed",
              },
            },
          ]),
        ),
      )

      const result = await availabilityService.getServiceProviderAvailability("provider-123", new Date("2024-03-15"))

      expect(result).toBeDefined()
      expect(result.providerId).toBe("provider-123")
      expect(result.date).toBe("2024-03-15")
      expect(Array.isArray(result.timeSlots)).toBe(true)
    })
  })

  describe("createConflict", () => {
    it("should create availability conflict successfully", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback(undefined)))

      await expect(
        availabilityService.createConflict(
          "listing-123",
          new Date("2024-03-01"),
          new Date("2024-03-03"),
          "booking",
          "booking-123",
          "user-123",
        ),
      ).resolves.not.toThrow()
    })
  })

  describe("removeConflict", () => {
    it("should remove availability conflict successfully", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback({ rowCount: 1 })))

      await expect(availabilityService.removeConflict("conflict-123")).resolves.not.toThrow()
    })
  })

  describe("blockDates", () => {
    it("should block dates for maintenance", async () => {
      // Mock checkAvailability to return true (dates are available)
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      await expect(
        availabilityService.blockDates(
          "listing-123",
          new Date("2024-03-10"),
          new Date("2024-03-12"),
          "maintenance",
          "Annual inspection",
          "host-123",
        ),
      ).resolves.not.toThrow()
    })
  })

  // Note: getConflictsByListing may not exist in the service
  // Removed this test as the method doesn't exist

  describe("calculateEndTime", () => {
    it("should calculate end time correctly for minutes", () => {
      const startDate = new Date("2024-03-15T10:00:00")
      const duration = { value: 120, unit: "minutes" }

      const result = (availabilityService as any).calculateEndTime(startDate, duration)

      expect(result.getHours()).toBe(12)
      expect(result.getMinutes()).toBe(0)
    })

    it("should calculate end time correctly for hours", () => {
      const startDate = new Date("2024-03-15T10:00:00")
      const duration = { value: 2, unit: "hours" }

      const result = (availabilityService as any).calculateEndTime(startDate, duration)

      expect(result.getHours()).toBe(12)
      expect(result.getMinutes()).toBe(0)
    })

    it("should handle days as duration unit", () => {
      const startDate = new Date("2024-03-15T10:00:00")
      const duration = { value: 1, unit: "days" }

      const result = (availabilityService as any).calculateEndTime(startDate, duration)

      expect(result.getDate()).toBe(16)
    })
  })

  describe("isTimeSlotAvailable", () => {
    it("should check if time slot is available", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      const isAvailable = await availabilityService.checkServiceAvailability(
        "provider-123",
        new Date("2024-03-15T14:00"),
        { value: 60, unit: "minutes" },
      )

      expect(isAvailable).toBe(true)
    })
  })
})
