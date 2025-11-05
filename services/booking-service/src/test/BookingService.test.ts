import { BookingStatus } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BookingService } from "../services/BookingService"

// Mock database connection
vi.mock("../db/connection", () => ({
  db: {
    transaction: vi.fn((callback) => callback(mockTx)),
    select: vi.fn(() => mockQueryBuilder),
    insert: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
    delete: vi.fn(() => mockQueryBuilder),
  },
  schema: {
    bookings: {},
    serviceBookings: {},
    bookingStatusHistory: {},
    availabilityConflicts: {},
    disputes: {},
  },
}))

// Mock services
vi.mock("../services/AvailabilityService", () => ({
  AvailabilityService: class {
    checkAvailability = vi.fn().mockResolvedValue(true)
    checkServiceAvailability = vi.fn().mockResolvedValue(true)
    createConflict = vi.fn().mockResolvedValue({ id: "conflict-1" })
  },
}))

vi.mock("../services/PricingService", () => ({
  PricingService: class {
    calculateBookingPrice = vi.fn().mockResolvedValue({
      basePrice: 3000,
      serviceFees: 300,
      taxes: 231,
      totalPrice: 3531,
      currency: "THB",
      breakdown: {},
    })
    calculateServicePrice = vi.fn().mockResolvedValue({
      basePrice: 2000,
      serviceFees: 200,
      taxes: 154,
      totalPrice: 2354,
      currency: "THB",
      breakdown: {},
    })
  },
}))

let mockQueryBuilderData: any[] = [
  {
    id: "booking-123",
    listingId: "listing-123",
    guestId: "guest-123",
    hostId: "host-123",
    type: "accommodation",
    status: "pending",
    checkIn: new Date("2024-03-01"),
    checkOut: new Date("2024-03-03"),
    nights: 2,
    adults: 2,
    children: 0,
    infants: 0,
    guests: 2,
    basePrice: "3000",
    serviceFees: "300",
    taxes: "231",
    totalPrice: "3531",
    currency: "THB",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  values: vi.fn(function (this: any, data: any) {
    // Update mockQueryBuilderData when inserting
    if (data.listingId || data.bookingId) {
      mockQueryBuilderData = [{ ...mockQueryBuilderData[0], ...data, id: data.id || "booking-new" }]
    }
    return this
  }),
  set: vi.fn(function (this: any, data: any) {
    // Update mockQueryBuilderData when updating
    mockQueryBuilderData = [{ ...mockQueryBuilderData[0], ...data }]
    return this
  }),
  leftJoin: vi.fn().mockReturnThis(),
  then: vi.fn((callback) => Promise.resolve(callback([...mockQueryBuilderData]))),
}

const mockTx = {
  select: vi.fn(() => mockQueryBuilder),
  insert: vi.fn(() => mockQueryBuilder),
  update: vi.fn(() => mockQueryBuilder),
  delete: vi.fn(() => mockQueryBuilder),
}

describe("BookingService", () => {
  let bookingService: BookingService

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockQueryBuilderData to default state
    mockQueryBuilderData = [
      {
        id: "booking-123",
        listingId: "listing-123",
        guestId: "guest-123",
        hostId: "host-123",
        type: "accommodation",
        status: "pending",
        checkIn: new Date("2024-03-01"),
        checkOut: new Date("2024-03-03"),
        nights: 2,
        adults: 2,
        children: 0,
        infants: 0,
        guests: 2,
        basePrice: "3000",
        serviceFees: "300",
        taxes: "231",
        totalPrice: "3531",
        currency: "THB",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    bookingService = new BookingService()
  })

  describe("createBooking", () => {
    it("should create a booking successfully", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
        adults: 2,
        children: 0,
        infants: 0,
      }

      const result = await bookingService.createBooking(request, "guest-123", "host-123")

      expect(result).toBeDefined()
      expect(result.id).toBe("booking-123")
      expect(result.status).toBe("pending")
      expect(result.totalPrice).toBe(3531)
    })

    it("should throw error if dates are not available", async () => {
      const availabilityService = (bookingService as any).availabilityService
      availabilityService.checkAvailability.mockResolvedValueOnce(false)

      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      await expect(bookingService.createBooking(request, "guest-123", "host-123")).rejects.toThrow(
        "Selected dates are not available",
      )
    })

    it("should handle single-day bookings", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        guests: 1,
      }

      const result = await bookingService.createBooking(request, "guest-123", "host-123")

      expect(result).toBeDefined()
      expect(result.nights).toBe(1)
    })
  })

  describe("createServiceBooking", () => {
    it("should create a service booking successfully", async () => {
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              id: "booking-456",
              type: "service",
              status: "pending",
              basePrice: "2000",
              totalPrice: "2354",
              currency: "THB",
            },
          ]),
        ),
      )

      const request = {
        listingId: "listing-123",
        serviceType: "photography",
        scheduledDate: "2024-03-15",
        scheduledTime: "10:00",
        duration: 120,
        deliveryMethod: "in_person",
      }

      const result = await bookingService.createServiceBooking(request, "guest-123", "provider-123")

      expect(result).toBeDefined()
      expect(result.id).toBe("booking-456")
      expect(result.type).toBe("service")
    })

    it("should throw error if service provider is not available", async () => {
      const availabilityService = (bookingService as any).availabilityService
      availabilityService.checkServiceAvailability.mockResolvedValueOnce(false)

      const request = {
        listingId: "listing-123",
        serviceType: "photography",
        scheduledDate: "2024-03-15",
        duration: 120,
        deliveryMethod: "in_person",
      }

      await expect(bookingService.createServiceBooking(request, "guest-123", "provider-123")).rejects.toThrow(
        "Service provider is not available",
      )
    })
  })

  describe("updateBookingStatus", () => {
    it("should update booking status successfully", async () => {
      mockQueryBuilder.then = vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "booking-123",
            status: "pending",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "booking-123",
            status: "confirmed",
            confirmedAt: new Date(),
          },
        ])

      const result = await bookingService.updateBookingStatus(
        "booking-123",
        {
          status: BookingStatus.CONFIRMED,
          reason: "Payment received",
        },
        "host-123",
      )

      expect(result).toBeDefined()
      expect(result.status).toBe("confirmed")
    })

    it("should throw error for invalid status transition", async () => {
      mockQueryBuilder.then = vi.fn().mockResolvedValueOnce([
        {
          id: "booking-123",
          status: "completed",
        },
      ])

      await expect(
        bookingService.updateBookingStatus(
          "booking-123",
          {
            status: BookingStatus.PENDING,
            reason: "Invalid transition",
          },
          "host-123",
        ),
      ).rejects.toThrow()
    })

    it("should throw error if booking not found", async () => {
      mockQueryBuilder.then = vi.fn().mockResolvedValueOnce([])

      await expect(
        bookingService.updateBookingStatus(
          "nonexistent",
          {
            status: BookingStatus.CONFIRMED,
          },
          "host-123",
        ),
      ).rejects.toThrow("Booking not found")
    })
  })

  describe("getBookingById", () => {
    it("should return booking if found", async () => {
      const result = await bookingService.getBookingById("booking-123")

      expect(result).toBeDefined()
      expect(result?.id).toBe("booking-123")
    })

    it("should return null if booking not found", async () => {
      mockQueryBuilder.then = vi.fn().mockResolvedValueOnce([])

      const result = await bookingService.getBookingById("nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("getBookings", () => {
    it("should return paginated bookings", async () => {
      // Mock count query
      mockQueryBuilder.then = vi
        .fn()
        .mockResolvedValueOnce([{ count: "10" }])
        .mockResolvedValueOnce([
          {
            id: "booking-1",
            status: "pending",
          },
          {
            id: "booking-2",
            status: "confirmed",
          },
        ])

      const result = await bookingService.getBookings({}, { page: 1, limit: 10 })

      expect(result.bookings).toHaveLength(2)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
    })

    it("should filter bookings by status", async () => {
      mockQueryBuilder.then = vi
        .fn()
        .mockResolvedValueOnce([{ count: "5" }])
        .mockResolvedValueOnce([
          {
            id: "booking-1",
            status: "confirmed",
          },
        ])

      const result = await bookingService.getBookings({ status: BookingStatus.CONFIRMED })

      expect(result.bookings).toHaveLength(1)
      expect(result.bookings[0].status).toBe("confirmed")
    })

    it("should filter bookings by guest", async () => {
      mockQueryBuilder.then = vi
        .fn()
        .mockResolvedValueOnce([{ count: "3" }])
        .mockResolvedValueOnce([
          {
            id: "booking-1",
            guestId: "guest-123",
          },
        ])

      const result = await bookingService.getBookings({ guestId: "guest-123" })

      expect(result.bookings).toHaveLength(1)
      expect(result.bookings[0].guestId).toBe("guest-123")
    })
  })

  describe("cancelBooking", () => {
    it("should cancel booking successfully", async () => {
      mockQueryBuilder.then = vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "booking-123",
            status: "pending",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "booking-123",
            status: "cancelled",
            cancelledAt: new Date(),
          },
        ])

      const result = await bookingService.cancelBooking("booking-123", "Customer request", "guest-123")

      expect(result).toBeDefined()
      expect(result.status).toBe("cancelled")
    })

    it("should throw error if booking cannot be cancelled", async () => {
      mockQueryBuilder.then = vi.fn().mockResolvedValueOnce([
        {
          id: "booking-123",
          status: "completed",
        },
      ])

      await expect(bookingService.cancelBooking("booking-123", "Too late", "guest-123")).rejects.toThrow()
    })
  })

  describe("validateStatusTransition", () => {
    it("should allow valid status transitions", () => {
      expect(() => {
        ;(bookingService as any).validateStatusTransition("pending", "confirmed")
      }).not.toThrow()

      expect(() => {
        ;(bookingService as any).validateStatusTransition("confirmed", "in_progress")
      }).not.toThrow()

      expect(() => {
        ;(bookingService as any).validateStatusTransition("in_progress", "completed")
      }).not.toThrow()
    })

    it("should reject invalid status transitions", () => {
      expect(() => {
        ;(bookingService as any).validateStatusTransition("completed", "pending")
      }).toThrow()

      expect(() => {
        ;(bookingService as any).validateStatusTransition("cancelled", "confirmed")
      }).toThrow()
    })
  })

  describe("getBookingStatusHistory", () => {
    it("should return status history for a booking", async () => {
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              id: "history-1",
              bookingId: "booking-123",
              fromStatus: null,
              toStatus: "pending",
              changedAt: new Date("2024-03-01"),
            },
            {
              id: "history-2",
              bookingId: "booking-123",
              fromStatus: "pending",
              toStatus: "confirmed",
              changedAt: new Date("2024-03-02"),
            },
          ]),
        ),
      )

      const result = await bookingService.getBookingStatusHistory("booking-123")

      expect(result).toHaveLength(2)
      expect(result[0].toStatus).toBe("pending")
      expect(result[1].toStatus).toBe("confirmed")
    })
  })
})
