import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createApp } from "../app"
import { FastifyInstance } from "fastify"

describe("AI Integration", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("Enhanced Search", () => {
    it("should handle enhanced search request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/search/enhanced",
        payload: {
          query: "scooter rental bangkok",
          filters: {
            type: "vehicle",
            priceRange: { min: 200, max: 500 },
          },
          userContext: {
            userId: "test-user",
            location: {
              latitude: 13.7563,
              longitude: 100.5018,
            },
          },
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("enhancedQuery")
      expect(result.data).toHaveProperty("suggestions")
      expect(result.data).toHaveProperty("aiInsights")
    })

    it("should validate required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/search/enhanced",
        payload: {
          // Missing required 'query' field
          filters: { type: "vehicle" },
        },
      })

      expect(response.statusCode).toBe(400)
      const result = JSON.parse(response.body)
      expect(result.error).toBe("Bad Request")
      expect(result.message).toContain("query")
    })
  })

  describe("Query Analysis", () => {
    it("should analyze query intent", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/query/analyze",
        payload: {
          query: "cheap apartment near BTS",
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("intent")
      expect(result.data).toHaveProperty("entities")
      expect(result.data).toHaveProperty("confidence")
    })
  })

  describe("Recommendations", () => {
    it("should get user recommendations", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/recommendations",
        payload: {
          userId: "test-user",
          category: "vehicle",
          userBehavior: {
            previousSearches: ["scooter", "motorbike"],
            viewedListings: ["listing-1", "listing-2"],
          },
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("recommendations")
      expect(result.data).toHaveProperty("metadata")
    })

    it("should require userId", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/recommendations",
        payload: {
          // Missing required 'userId' field
          category: "vehicle",
        },
      })

      expect(response.statusCode).toBe(400)
      const result = JSON.parse(response.body)
      expect(result.error).toBe("Bad Request")
      expect(result.message).toContain("userId")
    })
  })

  describe("Price Suggestions", () => {
    it("should get price suggestions", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/price-suggestions",
        payload: {
          listingId: "test-listing",
          category: "vehicle",
          location: {
            city: "Bangkok",
            region: "Bangkok",
            country: "TH",
          },
          features: {
            type: "scooter",
            brand: "Honda",
            year: 2023,
          },
          currentPrice: 300,
        },
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("suggestedPrice")
      expect(result.data).toHaveProperty("priceRange")
      expect(result.data).toHaveProperty("confidence")
    })
  })

  describe("Search Suggestions", () => {
    it("should get search suggestions", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/ai/suggestions?q=scoot",
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("suggestions")
      expect(Array.isArray(result.data.suggestions)).toBe(true)
    })

    it("should require query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/ai/suggestions",
      })

      expect(response.statusCode).toBe(400)
      const result = JSON.parse(response.body)
      expect(result.error).toBe("Bad Request")
      expect(result.message).toContain("q")
    })
  })

  describe("AI Status", () => {
    it("should get AI service status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/ai/status",
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("status")
      expect(result.data).toHaveProperty("service")
      expect(result.data).toHaveProperty("timestamp")
    })
  })

  describe("Error Handling", () => {
    it("should handle AI service unavailable gracefully", async () => {
      // This test assumes AI service is not running
      // In real scenarios, you might mock the AI client
      const response = await app.inject({
        method: "POST",
        url: "/api/ai/search/enhanced",
        payload: {
          query: "test query",
        },
      })

      // Should still return 200 with fallback response
      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.success).toBe(true)
      // Fallback response should contain original query
      expect(result.data.enhancedQuery).toBe("test query")
    })
  })
})
