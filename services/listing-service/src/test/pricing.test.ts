import { describe, expect, it } from "vitest"
import { getListingPricing, getServicePricing } from "../pricing"

describe("pricing module", () => {
  describe("getListingPricing", () => {
    it("returns default THB nightly pricing for any listing id", async () => {
      const pricing = await getListingPricing("listing-123")

      expect(pricing).toEqual({
        nightlyRate: 1500,
        cleaningFee: 300,
        securityDeposit: 2000,
        currency: "THB",
      })
    })

    it("ignores the listing id (stable defaults regardless of input)", async () => {
      const a = await getListingPricing("a")
      const b = await getListingPricing("completely-different-id")

      expect(a).toEqual(b)
      expect(a.currency).toBe("THB")
      expect(a.nightlyRate).toBeGreaterThan(0)
    })
  })

  describe("getServicePricing", () => {
    it("echoes the requested serviceType in an hourly THB default", async () => {
      const pricing = await getServicePricing("listing-9", "cleaning")

      expect(pricing).toEqual({
        serviceType: "cleaning",
        priceType: "hourly",
        basePrice: 800,
        hourlyRate: 800,
        currency: "THB",
      })
    })

    it("preserves arbitrary service type strings", async () => {
      const pricing = await getServicePricing("listing-9", "visa_assistance")
      expect(pricing.serviceType).toBe("visa_assistance")
      expect(pricing.priceType).toBe("hourly")
      expect(pricing.basePrice).toBeGreaterThan(0)
      expect(pricing.hourlyRate).toBe(pricing.basePrice)
    })
  })
})
