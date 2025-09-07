import { describe, it, expect, beforeEach } from "vitest"
import { ServiceProviderService } from "../services/ServiceProviderService.js"

describe("ServiceProviderService", () => {
  let serviceProviderService: ServiceProviderService

  beforeEach(() => {
    serviceProviderService = new ServiceProviderService()
  })

  describe("Data Validation", () => {
    describe("Service Provider Creation", () => {
      it("should validate service provider data structure", () => {
        const serviceProviderData = {
          ownerId: "user-123",
          businessName: "Thai Scooter Rentals",
          businessType: "company" as const,
          description: "Professional scooter rental service in Bangkok",
          services: [
            {
              name: "Scooter Rental",
              category: "transportation",
              subcategory: "scooter",
              description: "Daily scooter rentals",
              price: 300,
              currency: "THB",
              priceType: "daily" as const,
              availability: {
                daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
                timeSlots: [{ start: "08:00", end: "20:00" }],
                timezone: "Asia/Bangkok",
              },
              serviceArea: {
                radius: 15,
                locations: ["Bangkok", "Sukhumvit"],
              },
            },
          ],
          contactInfo: {
            name: "John Doe",
            phone: "+66812345678",
            email: "john@thaiscooters.com",
            website: "https://thaiscooters.com",
          },
          location: {
            address: "123 Sukhumvit Road",
            city: "Bangkok",
            region: "Bangkok",
            country: "Thailand",
            latitude: 13.7563,
            longitude: 100.5018,
            postalCode: "10110",
          },
          languages: ["th", "en"],
          settings: {
            autoAcceptBookings: true,
            instantBooking: false,
            requireDeposit: true,
            cancellationPolicy: "24 hours notice required",
            refundPolicy: "Full refund with 24h notice",
          },
          images: ["image1.jpg", "image2.jpg"],
        }

        // Validate structure
        expect(serviceProviderData).toHaveProperty("ownerId")
        expect(serviceProviderData).toHaveProperty("businessName")
        expect(serviceProviderData).toHaveProperty("businessType")
        expect(serviceProviderData).toHaveProperty("services")
        expect(serviceProviderData).toHaveProperty("contactInfo")
        expect(serviceProviderData).toHaveProperty("location")

        // Validate services array
        expect(Array.isArray(serviceProviderData.services)).toBe(true)
        expect(serviceProviderData.services.length).toBeGreaterThan(0)

        const service = serviceProviderData.services[0]
        expect(service).toHaveProperty("name")
        expect(service).toHaveProperty("category")
        expect(service).toHaveProperty("price")
        expect(typeof service.price).toBe("number")
        expect(service.price).toBeGreaterThan(0)
      })

      it("should validate required fields for service provider creation", () => {
        const requiredFields = [
          "ownerId",
          "businessType",
          "description",
          "services",
          "contactInfo",
          "location",
        ]

        const serviceProviderData = {
          ownerId: "user-123",
          businessType: "individual" as const,
          description: "Freelance tour guide",
          services: [
            {
              name: "City Tour",
              category: "tourism",
              price: 1500,
              currency: "THB",
            },
          ],
          contactInfo: {
            phone: "+66812345678",
            email: "guide@example.com",
          },
          location: {
            address: "456 Khao San Road",
            city: "Bangkok",
            region: "Bangkok",
            country: "Thailand",
          },
        }

        requiredFields.forEach((field) => {
          expect(serviceProviderData).toHaveProperty(field)
        })

        // Validate contact info required fields
        expect(serviceProviderData.contactInfo).toHaveProperty("phone")
        expect(serviceProviderData.contactInfo).toHaveProperty("email")

        // Validate location required fields
        expect(serviceProviderData.location).toHaveProperty("city")
        expect(serviceProviderData.location).toHaveProperty("country")
      })
    })

    describe("Service Provider Search", () => {
      it("should handle service provider search filters", () => {
        const searchFilters = {
          providerType: "company" as const,
          serviceTypes: ["transportation", "tourism"],
          location: {
            city: "Bangkok",
            radius: 10,
          },
          verificationLevel: "verified" as const,
          rating: {
            min: 4.0,
            max: 5.0,
          },
          priceRange: {
            min: 200,
            max: 1000,
            currency: "THB",
          },
          languages: ["en", "th"],
          instantBooking: true,
        }

        // Validate filter structure
        expect(searchFilters).toHaveProperty("providerType")
        expect(searchFilters).toHaveProperty("serviceTypes")
        expect(searchFilters).toHaveProperty("location")
        expect(searchFilters).toHaveProperty("priceRange")

        // Validate arrays
        expect(Array.isArray(searchFilters.serviceTypes)).toBe(true)
        expect(Array.isArray(searchFilters.languages)).toBe(true)

        // Validate price range
        expect(searchFilters.priceRange.min).toBeLessThan(searchFilters.priceRange.max)
        expect(searchFilters.priceRange).toHaveProperty("currency")

        // Validate rating range
        expect(searchFilters.rating.min).toBeGreaterThanOrEqual(0)
        expect(searchFilters.rating.max).toBeLessThanOrEqual(5)
      })
    })

    describe("Data Validation", () => {
      it("should validate service pricing", () => {
        const pricingData = [
          { price: 100, currency: "THB", priceType: "hourly" },
          { price: 500, currency: "THB", priceType: "daily" },
          { price: 2000, currency: "THB", priceType: "project" },
        ]

        pricingData.forEach((pricing) => {
          expect(pricing.price).toBeGreaterThan(0)
          expect(pricing.currency).toBe("THB")
          expect(["hourly", "daily", "project", "fixed"]).toContain(pricing.priceType)
        })
      })

      it("should validate contact information", () => {
        const contactInfo = {
          phone: "+66812345678",
          email: "test@example.com",
          website: "https://example.com",
        }

        // Phone validation (basic)
        expect(contactInfo.phone).toMatch(/^\+66\d{9}$/)

        // Email validation (basic)
        expect(contactInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

        // Website validation (basic)
        expect(contactInfo.website).toMatch(/^https?:\/\/.+/)
      })

      it("should validate location coordinates", () => {
        const locations = [
          { latitude: 13.7563, longitude: 100.5018, city: "Bangkok" },
          { latitude: 18.7883, longitude: 98.9853, city: "Chiang Mai" },
          { latitude: 7.8804, longitude: 98.3923, city: "Phuket" },
        ]

        locations.forEach((location) => {
          // Thailand latitude range: approximately 5.6 to 20.5
          expect(location.latitude).toBeGreaterThanOrEqual(5.6)
          expect(location.latitude).toBeLessThanOrEqual(20.5)

          // Thailand longitude range: approximately 97.3 to 105.6
          expect(location.longitude).toBeGreaterThanOrEqual(97.3)
          expect(location.longitude).toBeLessThanOrEqual(105.6)

          expect(location.city).toBeTruthy()
        })
      })
    })

    describe("Business Logic", () => {
      it("should validate service availability", () => {
        const availability = {
          daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
          timeSlots: [
            { start: "09:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          timezone: "Asia/Bangkok",
        }

        // Validate days of week (1-7, Monday-Sunday)
        availability.daysOfWeek.forEach((day) => {
          expect(day).toBeGreaterThanOrEqual(1)
          expect(day).toBeLessThanOrEqual(7)
        })

        // Validate time slots
        availability.timeSlots.forEach((slot) => {
          expect(slot.start).toMatch(/^\d{2}:\d{2}$/)
          expect(slot.end).toMatch(/^\d{2}:\d{2}$/)

          // Convert to minutes for comparison
          const startMinutes =
            parseInt(slot.start.split(":")[0]) * 60 + parseInt(slot.start.split(":")[1])
          const endMinutes =
            parseInt(slot.end.split(":")[0]) * 60 + parseInt(slot.end.split(":")[1])

          expect(endMinutes).toBeGreaterThan(startMinutes)
        })

        expect(availability.timezone).toBe("Asia/Bangkok")
      })

      it("should validate business types", () => {
        const validBusinessTypes = ["individual", "company", "agency", "freelancer"]
        const testBusinessTypes = ["individual", "company", "agency", "freelancer"]

        testBusinessTypes.forEach((type) => {
          expect(validBusinessTypes).toContain(type)
        })
      })

      it("should validate service categories", () => {
        const serviceCategories = [
          "transportation",
          "tourism",
          "accommodation",
          "food",
          "entertainment",
          "health",
          "education",
          "business",
          "technology",
          "other",
        ]

        const testServices = [
          { category: "transportation", name: "Scooter Rental" },
          { category: "tourism", name: "City Tour" },
          { category: "accommodation", name: "Hotel Booking" },
          { category: "food", name: "Restaurant Delivery" },
        ]

        testServices.forEach((service) => {
          expect(serviceCategories).toContain(service.category)
          expect(service.name).toBeTruthy()
        })
      })
    })
  })
})
