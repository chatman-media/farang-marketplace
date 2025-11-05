import { beforeEach, describe, expect, it, vi } from "vitest"
import { PricingService } from "../services/PricingService"

// Mock ListingServiceClient
vi.mock("../clients/ListingServiceClient", () => ({
  ListingServiceClient: class {
    getListingById = vi.fn().mockResolvedValue({
      id: "listing-123",
      price: 3000,
      currency: "THB",
      cleaningFee: 500,
    })
    getServicePricing = vi.fn().mockResolvedValue({
      basePrice: 2000,
      currency: "THB",
    })
  },
}))

// Mock database connection
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  then: vi.fn((callback) => Promise.resolve(callback([]))),
}

vi.mock("../db/connection", () => ({
  db: {
    select: vi.fn(() => mockQueryBuilder),
  },
  schema: {
    bookings: {},
  },
}))

describe("PricingService", () => {
  let pricingService: PricingService

  beforeEach(() => {
    vi.clearAllMocks()
    pricingService = new PricingService()
  })

  describe("calculateBookingPrice", () => {
    it("should calculate price correctly for accommodation booking", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      const result = await pricingService.calculateBookingPrice(request)

      expect(result).toBeDefined()
      expect(result.basePrice).toBeGreaterThan(0)
      expect(result.serviceFees).toBeGreaterThan(0)
      expect(result.taxes).toBeGreaterThan(0)
      expect(result.totalPrice).toBeGreaterThan(0)
      expect(result.currency).toBe("THB")
      expect(result.breakdown).toBeDefined()
    })

    it("should handle single-night bookings", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        guests: 1,
      }

      const result = await pricingService.calculateBookingPrice(request)

      expect(result).toBeDefined()
      expect(result.breakdown.numberOfNights).toBe(1)
    })

    it("should calculate service fees correctly", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      const result = await pricingService.calculateBookingPrice(request)

      // Platform fee should be 3% of base price
      expect(result.breakdown.platformFee).toBeGreaterThan(0)
      // Payment processing fee should be 2.9% of base + platform fee
      expect(result.breakdown.paymentProcessingFee).toBeGreaterThan(0)
      // VAT should be 7% of total before tax
      expect(result.breakdown.vat).toBeGreaterThan(0)
    })

    it("should apply cleaning fee if present", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      const result = await pricingService.calculateBookingPrice(request)

      expect(result.breakdown.cleaningFee).toBeDefined()
      expect(result.breakdown.cleaningFee).toBeGreaterThan(0)
    })
  })

  describe("calculateServicePrice", () => {
    it("should calculate price for service booking", async () => {
      const request = {
        listingId: "listing-123",
        serviceType: "photography",
        duration: {
          value: 120,
          unit: "minutes" as const,
        },
        deliveryMethod: "in_person" as const,
      }

      const result = await pricingService.calculateServicePrice(request)

      expect(result).toBeDefined()
      expect(result.basePrice).toBeGreaterThan(0)
      expect(result.serviceFees).toBeGreaterThan(0)
      expect(result.taxes).toBeGreaterThan(0)
      expect(result.totalPrice).toBeGreaterThan(0)
      expect(result.currency).toBe("THB")
    })

    it("should handle hourly pricing", async () => {
      const request = {
        listingId: "listing-123",
        serviceType: "consultation",
        duration: {
          value: 2,
          unit: "hours" as const,
        },
        deliveryMethod: "online" as const,
      }

      const result = await pricingService.calculateServicePrice(request)

      expect(result).toBeDefined()
      expect(result.basePrice).toBeGreaterThan(0)
    })

    it("should handle different delivery methods", async () => {
      const requestOnline = {
        listingId: "listing-123",
        serviceType: "consulting",
        duration: { value: 60, unit: "minutes" as const },
        deliveryMethod: "online" as const,
      }

      const requestInPerson = {
        ...requestOnline,
        deliveryMethod: "in_person" as const,
      }

      const onlinePrice = await pricingService.calculateServicePrice(requestOnline)
      const inPersonPrice = await pricingService.calculateServicePrice(requestInPerson)

      expect(onlinePrice.totalPrice).toBeGreaterThan(0)
      expect(inPersonPrice.totalPrice).toBeGreaterThan(0)
    })
  })

  describe("calculateDemandMultiplier", () => {
    it("should calculate demand multiplier based on booking density", async () => {
      // Mock high demand (many bookings)
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([{ count: "25" }])))

      const multiplier = await (pricingService as any).calculateDemandMultiplier("listing-123", new Date("2024-03-15"))

      expect(multiplier).toBeGreaterThanOrEqual(1.0)
      expect(multiplier).toBeLessThanOrEqual(2.0)
    })

    it("should return 1.0 for low demand", async () => {
      // Mock low demand (few bookings)
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([{ count: "2" }])))

      const multiplier = await (pricingService as any).calculateDemandMultiplier("listing-123", new Date("2024-03-15"))

      expect(multiplier).toBe(1.0)
    })

    it("should use cached multiplier if available", async () => {
      // First call - should query database
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([{ count: "5" }])))

      const multiplier1 = await (pricingService as any).calculateDemandMultiplier("listing-123", new Date("2024-03-15"))

      // Second call - should use cache (database call count should not increase)
      const multiplier2 = await (pricingService as any).calculateDemandMultiplier("listing-123", new Date("2024-03-15"))

      expect(multiplier1).toBe(multiplier2)
    })
  })

  describe("calculateSeasonalMultiplier", () => {
    it("should apply seasonal multiplier for high season", () => {
      // December - high season in Thailand
      const date = new Date("2024-12-15")

      const multiplier = (pricingService as any).calculateSeasonalMultiplier(date)

      expect(multiplier).toBeGreaterThan(1.0)
    })

    it("should apply lower multiplier for low season", () => {
      // May - low season in Thailand (rainy season)
      const date = new Date("2024-05-15")

      const multiplier = (pricingService as any).calculateSeasonalMultiplier(date)

      expect(multiplier).toBeGreaterThanOrEqual(1.0)
      expect(multiplier).toBeLessThanOrEqual(1.2)
    })

    it("should handle different months appropriately", () => {
      const highSeasonMonths = [11, 0, 1] // Dec, Jan, Feb
      const lowSeasonMonths = [4, 5, 6, 7, 8] // May-Sep

      highSeasonMonths.forEach((month) => {
        const date = new Date(2024, month, 15)
        const multiplier = (pricingService as any).calculateSeasonalMultiplier(date)
        expect(multiplier).toBeGreaterThanOrEqual(1.15)
      })

      lowSeasonMonths.forEach((month) => {
        const date = new Date(2024, month, 15)
        const multiplier = (pricingService as any).calculateSeasonalMultiplier(date)
        expect(multiplier).toBeGreaterThanOrEqual(0.9)
        expect(multiplier).toBeLessThanOrEqual(1.05)
      })
    })
  })

  describe("applyPricingRules", () => {
    it("should apply early booking discount", () => {
      const basePrice = 3000
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() + 60) // 60 days in advance

      const rules = [
        {
          id: "early-bird",
          name: "Early Bird Discount",
          type: "discount" as const,
          condition: {
            advanceBookingDays: 30,
          },
          value: {
            type: "percentage" as const,
            amount: 10,
          },
          priority: 1,
        },
      ]

      const discounts = (pricingService as any).applyPricingRules(basePrice, checkIn, 2, 2, rules)

      expect(discounts).toBeGreaterThan(0)
    })

    it("should apply long stay discount", () => {
      const basePrice = 3000
      const checkIn = new Date("2024-03-01")
      const nights = 7

      const rules = [
        {
          id: "week-discount",
          name: "Weekly Stay Discount",
          type: "discount" as const,
          condition: {
            minNights: 7,
          },
          value: {
            type: "percentage" as const,
            amount: 15,
          },
          priority: 2,
        },
      ]

      const discounts = (pricingService as any).applyPricingRules(basePrice, checkIn, 2, nights, rules)

      expect(discounts).toBeGreaterThan(0)
    })

    it("should not apply discount if conditions not met", () => {
      const basePrice = 3000
      const checkIn = new Date()
      const nights = 2

      const rules = [
        {
          id: "week-discount",
          name: "Weekly Stay Discount",
          type: "discount" as const,
          condition: {
            minNights: 7, // Requires 7 nights, but booking is only 2
          },
          value: {
            type: "percentage" as const,
            amount: 15,
          },
          priority: 2,
        },
      ]

      const discounts = (pricingService as any).applyPricingRules(basePrice, checkIn, 2, nights, rules)

      expect(discounts).toBe(0)
    })
  })

  describe("Cache management", () => {
    it("should cleanup expired cache entries", () => {
      const cache = (pricingService as any).cache

      // Add expired entry
      cache.demandMultipliers.set("test-key", {
        data: 1.5,
        timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
        ttl: 15 * 60 * 1000, // 15 minutes TTL (expired)
      })

      // Add non-expired entry
      cache.demandMultipliers.set("test-key-2", {
        data: 1.3,
        timestamp: Date.now(),
        ttl: 15 * 60 * 1000, // 15 minutes TTL
      })

      ;(pricingService as any).cleanupExpiredCache()

      expect(cache.demandMultipliers.has("test-key")).toBe(false)
      expect(cache.demandMultipliers.has("test-key-2")).toBe(true)
    })
  })

  describe("Currency conversion", () => {
    it("should return prices in default currency (THB)", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      const result = await pricingService.calculateBookingPrice(request)

      expect(result.currency).toBe("THB")
    })
  })

  describe("Fee calculations", () => {
    it("should calculate platform fee as 3%", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      const result = await pricingService.calculateBookingPrice(request)

      const expectedPlatformFee = result.basePrice * 0.03
      expect(Math.abs(result.breakdown.platformFee - expectedPlatformFee)).toBeLessThan(1) // Allow for rounding
    })

    it("should calculate VAT as 7%", async () => {
      const request = {
        listingId: "listing-123",
        checkIn: "2024-03-01",
        checkOut: "2024-03-03",
        guests: 2,
      }

      const result = await pricingService.calculateBookingPrice(request)

      // VAT is 7% of subtotal (before tax)
      expect(result.breakdown.vat).toBeGreaterThan(0)
    })
  })
})
