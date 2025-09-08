import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { db } from "../db/connection"
import { RealEstateService } from "../services/RealEstateService"
import type { CreateRealEstateRequest } from "@marketplace/shared-types"

describe("RealEstateService", () => {
  let realEstateService: RealEstateService
  let testOwnerId: string

  beforeAll(async () => {
    realEstateService = new RealEstateService()
    testOwnerId = "test-owner-123"
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await db.execute(`DELETE FROM real_estate WHERE listing_id IN (
      SELECT id FROM listings WHERE owner_id = '${testOwnerId}'
    )`)
    await db.execute(`DELETE FROM listings WHERE owner_id = '${testOwnerId}'`)
  })

  afterAll(async () => {
    // Clean up after all tests
    await db.execute(`DELETE FROM real_estate WHERE listing_id IN (
      SELECT id FROM listings WHERE owner_id = '${testOwnerId}'
    )`)
    await db.execute(`DELETE FROM listings WHERE owner_id = '${testOwnerId}'`)
  })

  describe("createRealEstate", () => {
    it("should create a real estate listing successfully", async () => {
      const realEstateData: CreateRealEstateRequest = {
        title: "Modern Condo in Bangkok",
        description: "Beautiful 2-bedroom condo with city view and modern amenities",
        propertyType: "condo",
        listingPurpose: "rent",
        bedrooms: 2,
        bathrooms: 2,
        area: 65,
        livingArea: 55,
        floor: 15,
        totalFloors: 30,
        buildingType: "high_rise",
        buildingAge: 5,
        yearBuilt: 2019,
        furnishing: "fully_furnished",
        condition: "excellent",
        views: ["city", "pool"],
        orientation: "south",
        balconies: 1,
        terraces: 0,
        price: 25000,
        pricePerSqm: 384.62,
        currency: "THB",
        priceType: "fixed",
        monthlyRate: 25000,
        securityDeposit: 50000,
        cleaningFee: 2000,
        electricityIncluded: false,
        waterIncluded: true,
        internetIncluded: true,
        cableIncluded: false,
        gasIncluded: false,
        parkingSpaces: 1,
        parkingType: "covered",
        parkingFee: 1000,
        location: {
          address: "123 Sukhumvit Road",
          city: "Bangkok",
          region: "Bangkok",
          country: "Thailand",
          zipCode: "10110",
          latitude: 13.7563,
          longitude: 100.5018,
        },
        images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg", "https://example.com/image3.jpg"],
        videos: ["https://example.com/video1.mp4"],
        virtualTour: "https://example.com/tour",
        amenities: {
          hasSwimmingPool: true,
          hasFitnessCenter: true,
          hasElevator: true,
          hasSecurity: true,
          hasParking: true,
          hasAirConditioning: true,
          hasWifi: true,
          petsAllowed: false,
        },
        rules: {
          maxGuests: 4,
          checkInTime: "15:00",
          checkOutTime: "11:00",
          smokingAllowed: false,
          partiesAllowed: false,
          eventsAllowed: false,
          cancellationPolicy: "moderate",
        },
      }

      const result = await realEstateService.createRealEstate(testOwnerId, realEstateData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.title).toBe(realEstateData.title)
      expect(result.description).toBe(realEstateData.description)
      expect(result.category).toBe("real_estate")
      expect(result.realEstate).toBeDefined()
      expect(result.realEstate?.propertyType).toBe(realEstateData.propertyType)
      expect(result.realEstate?.bedrooms).toBe(realEstateData.bedrooms)
      expect(result.realEstate?.bathrooms).toBe(realEstateData.bathrooms)
      expect(result.realEstate?.area).toBe(realEstateData.area)
      expect(result.realEstate?.price).toBe(realEstateData.price)
      expect(result.realEstate?.furnishing).toBe(realEstateData.furnishing)
      expect(result.realEstate?.parkingSpaces).toBe(realEstateData.parkingSpaces)
    })

    it("should create real estate with minimal required fields", async () => {
      const minimalData: CreateRealEstateRequest = {
        title: "Simple Apartment",
        description: "Basic apartment for rent",
        propertyType: "apartment",
        listingPurpose: "rent",
        bedrooms: 1,
        bathrooms: 1,
        area: 30,
        furnishing: "unfurnished",
        condition: "good",
        views: [],
        price: 15000,
        currency: "THB",
        priceType: "fixed",
        location: {
          address: "456 Test Street",
          city: "Bangkok",
          region: "Bangkok",
          country: "Thailand",
        },
        images: ["https://example.com/minimal.jpg"],
      }

      const result = await realEstateService.createRealEstate(testOwnerId, minimalData)

      expect(result).toBeDefined()
      expect(result.realEstate?.bedrooms).toBe(1)
      expect(result.realEstate?.bathrooms).toBe(1)
      expect(result.realEstate?.area).toBe(30)
      expect(result.realEstate?.furnishing).toBe("unfurnished")
      expect(result.realEstate?.parkingSpaces).toBe(0)
      expect(result.realEstate?.balconies).toBe(0)
      expect(result.realEstate?.terraces).toBe(0)
    })
  })

  describe("getRealEstateById", () => {
    it("should retrieve real estate listing by ID", async () => {
      // First create a listing
      const realEstateData: CreateRealEstateRequest = {
        title: "Test Condo",
        description: "Test description",
        propertyType: "condo",
        listingPurpose: "sale",
        bedrooms: 2,
        bathrooms: 2,
        area: 70,
        furnishing: "partially_furnished",
        condition: "good",
        views: ["sea"],
        price: 3500000,
        currency: "THB",
        priceType: "negotiable",
        location: {
          address: "789 Beach Road",
          city: "Pattaya",
          region: "Chonburi",
          country: "Thailand",
        },
        images: ["https://example.com/test.jpg"],
      }

      const created = await realEstateService.createRealEstate(testOwnerId, realEstateData)

      // Then retrieve it
      const retrieved = await realEstateService.getRealEstateById(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.title).toBe(realEstateData.title)
      expect(retrieved?.realEstate?.propertyType).toBe(realEstateData.propertyType)
      expect(retrieved?.realEstate?.listingPurpose).toBe(realEstateData.listingPurpose)
      expect(retrieved?.realEstate?.price).toBe(realEstateData.price)
    })

    it("should return null for non-existent ID", async () => {
      const result = await realEstateService.getRealEstateById("non-existent-id")
      expect(result).toBeNull()
    })
  })

  describe("searchRealEstate", () => {
    beforeEach(async () => {
      // Create test data for search
      const testData = [
        {
          title: "Luxury Villa",
          description: "Luxury villa with pool",
          propertyType: "villa" as const,
          listingPurpose: "sale" as const,
          bedrooms: 4,
          bathrooms: 3,
          area: 200,
          furnishing: "luxury_furnished" as const,
          condition: "excellent",
          views: ["sea", "garden"],
          price: 15000000,
          currency: "THB" as const,
          priceType: "fixed" as const,
          location: {
            address: "Villa Street 1",
            city: "Phuket",
            region: "Phuket",
            country: "Thailand",
          },
          images: ["https://example.com/villa1.jpg"],
        },
        {
          title: "City Apartment",
          description: "Modern apartment in city center",
          propertyType: "apartment" as const,
          listingPurpose: "rent" as const,
          bedrooms: 1,
          bathrooms: 1,
          area: 45,
          furnishing: "fully_furnished" as const,
          condition: "good",
          views: ["city"],
          price: 20000,
          currency: "THB" as const,
          priceType: "fixed" as const,
          location: {
            address: "City Center 123",
            city: "Bangkok",
            region: "Bangkok",
            country: "Thailand",
          },
          images: ["https://example.com/apt1.jpg"],
        },
      ]

      for (const data of testData) {
        await realEstateService.createRealEstate(testOwnerId, data)
      }
    })

    it("should search by property type", async () => {
      const results = await realEstateService.searchRealEstate({
        propertyType: ["villa"],
        page: 1,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
      })

      expect(results.listings).toHaveLength(1)
      expect(results.listings[0].realEstate?.propertyType).toBe("villa")
      expect(results.total).toBe(1)
      expect(results.hasMore).toBe(false)
    })

    it("should search by listing purpose", async () => {
      const results = await realEstateService.searchRealEstate({
        listingPurpose: ["rent"],
        page: 1,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
      })

      expect(results.listings).toHaveLength(1)
      expect(results.listings[0].realEstate?.listingPurpose).toBe("rent")
    })

    it("should search by price range", async () => {
      const results = await realEstateService.searchRealEstate({
        minPrice: 10000,
        maxPrice: 50000,
        page: 1,
        limit: 10,
        sortBy: "price",
        sortOrder: "asc",
      })

      expect(results.listings).toHaveLength(1)
      expect(results.listings[0].realEstate?.price).toBe(20000)
    })

    it("should search by bedrooms", async () => {
      const results = await realEstateService.searchRealEstate({
        minBedrooms: 3,
        page: 1,
        limit: 10,
        sortBy: "bedrooms",
        sortOrder: "desc",
      })

      expect(results.listings).toHaveLength(1)
      expect(results.listings[0].realEstate?.bedrooms).toBe(4)
    })

    it("should search by city", async () => {
      const results = await realEstateService.searchRealEstate({
        city: "Bangkok",
        page: 1,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
      })

      expect(results.listings).toHaveLength(1)
      expect(results.listings[0].location.city).toBe("Bangkok")
    })

    it("should handle pagination", async () => {
      const results = await realEstateService.searchRealEstate({
        page: 1,
        limit: 1,
        sortBy: "created_at",
        sortOrder: "desc",
      })

      expect(results.listings).toHaveLength(1)
      expect(results.total).toBe(2)
      expect(results.hasMore).toBe(true)
    })
  })

  describe("updateRealEstate", () => {
    it("should update real estate listing", async () => {
      // Create a listing first
      const originalData: CreateRealEstateRequest = {
        title: "Original Title",
        description: "Original description",
        propertyType: "condo",
        listingPurpose: "rent",
        bedrooms: 2,
        bathrooms: 2,
        area: 60,
        furnishing: "unfurnished",
        condition: "good",
        views: [],
        price: 20000,
        currency: "THB",
        priceType: "fixed",
        location: {
          address: "Original Address",
          city: "Bangkok",
          region: "Bangkok",
          country: "Thailand",
        },
        images: ["https://example.com/original.jpg"],
      }

      const created = await realEstateService.createRealEstate(testOwnerId, originalData)

      // Update the listing
      const updateData = {
        id: created.id,
        title: "Updated Title",
        price: 25000,
        furnishing: "fully_furnished" as const,
        bedrooms: 3,
      }

      const updated = await realEstateService.updateRealEstate(created.id, testOwnerId, updateData)

      expect(updated).toBeDefined()
      expect(updated?.title).toBe("Updated Title")
      expect(updated?.realEstate?.price).toBe(25000)
      expect(updated?.realEstate?.furnishing).toBe("fully_furnished")
      expect(updated?.realEstate?.bedrooms).toBe(3)
      // Unchanged fields should remain the same
      expect(updated?.description).toBe(originalData.description)
      expect(updated?.realEstate?.bathrooms).toBe(originalData.bathrooms)
    })

    it("should return null for non-existent listing", async () => {
      const result = await realEstateService.updateRealEstate("non-existent-id", testOwnerId, {
        id: "non-existent-id",
        title: "New Title",
      })

      expect(result).toBeNull()
    })

    it("should return null for wrong owner", async () => {
      // Create a listing
      const realEstateData: CreateRealEstateRequest = {
        title: "Test Listing",
        description: "Test description",
        propertyType: "apartment",
        listingPurpose: "rent",
        bedrooms: 1,
        bathrooms: 1,
        area: 40,
        furnishing: "unfurnished",
        condition: "good",
        views: [],
        price: 15000,
        currency: "THB",
        priceType: "fixed",
        location: {
          address: "Test Address",
          city: "Bangkok",
          region: "Bangkok",
          country: "Thailand",
        },
        images: ["https://example.com/test.jpg"],
      }

      const created = await realEstateService.createRealEstate(testOwnerId, realEstateData)

      // Try to update with wrong owner
      const result = await realEstateService.updateRealEstate(created.id, "wrong-owner-id", {
        id: created.id,
        title: "Hacked Title",
      })

      expect(result).toBeNull()
    })
  })

  describe("deleteRealEstate", () => {
    it("should delete real estate listing", async () => {
      // Create a listing first
      const realEstateData: CreateRealEstateRequest = {
        title: "To Be Deleted",
        description: "This will be deleted",
        propertyType: "studio",
        listingPurpose: "rent",
        bedrooms: 0,
        bathrooms: 1,
        area: 25,
        furnishing: "unfurnished",
        condition: "fair",
        views: [],
        price: 12000,
        currency: "THB",
        priceType: "fixed",
        location: {
          address: "Delete Street",
          city: "Bangkok",
          region: "Bangkok",
          country: "Thailand",
        },
        images: ["https://example.com/delete.jpg"],
      }

      const created = await realEstateService.createRealEstate(testOwnerId, realEstateData)

      // Delete the listing
      const deleted = await realEstateService.deleteRealEstate(created.id, testOwnerId)
      expect(deleted).toBe(true)

      // Verify it's deleted
      const retrieved = await realEstateService.getRealEstateById(created.id)
      expect(retrieved).toBeNull()
    })

    it("should return false for non-existent listing", async () => {
      const result = await realEstateService.deleteRealEstate("non-existent-id", testOwnerId)
      expect(result).toBe(false)
    })

    it("should return false for wrong owner", async () => {
      // Create a listing
      const realEstateData: CreateRealEstateRequest = {
        title: "Protected Listing",
        description: "Cannot be deleted by wrong owner",
        propertyType: "house",
        listingPurpose: "sale",
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        furnishing: "unfurnished",
        condition: "good",
        views: [],
        price: 5000000,
        currency: "THB",
        priceType: "negotiable",
        location: {
          address: "Protected Street",
          city: "Bangkok",
          region: "Bangkok",
          country: "Thailand",
        },
        images: ["https://example.com/protected.jpg"],
      }

      const created = await realEstateService.createRealEstate(testOwnerId, realEstateData)

      // Try to delete with wrong owner
      const result = await realEstateService.deleteRealEstate(created.id, "wrong-owner-id")
      expect(result).toBe(false)

      // Verify it still exists
      const retrieved = await realEstateService.getRealEstateById(created.id)
      expect(retrieved).toBeDefined()
    })
  })
})
