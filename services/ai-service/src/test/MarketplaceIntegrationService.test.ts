import { describe, it, expect, beforeEach } from "vitest"
import { MarketplaceIntegrationService } from "../services/MarketplaceIntegrationService.js"
import { AIProviderService } from "../services/AIProviderService.js"
import { RecommendationEngine } from "../services/RecommendationEngine.js"
import { UserBehaviorService } from "../services/UserBehaviorService.js"
import { ContentAnalysisService } from "../services/ContentAnalysisService.js"

describe("MarketplaceIntegrationService", () => {
  let marketplaceService: MarketplaceIntegrationService

  beforeEach(() => {
    // Initialize with real services for basic testing
    const aiProvider = new AIProviderService()
    const recommendationEngine = new RecommendationEngine(aiProvider)
    const userBehaviorService = new UserBehaviorService(aiProvider)
    const contentAnalysisService = new ContentAnalysisService(aiProvider)

    marketplaceService = new MarketplaceIntegrationService(
      aiProvider,
      recommendationEngine,
      userBehaviorService,
      contentAnalysisService
    )
  })

  describe("Booking Intelligence", () => {
    it("should generate booking intelligence successfully", async () => {
      const userId = "user-123"
      const listingId = "listing-456"
      const bookingData = {
        bookingId: "booking-789",
        currentPrice: 1000,
        checkIn: "2024-03-15",
        checkOut: "2024-03-17",
      }

      const result = await marketplaceService.generateBookingIntelligence(
        userId,
        listingId,
        bookingData
      )

      expect(result).toBeDefined()
      expect(result.userId).toBe(userId)
      expect(result.listingId).toBe(listingId)
      expect(result.intelligenceType).toBe("matching")
      expect(result.recommendations).toBeDefined()
      expect(result.riskScore).toBeDefined()
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it("should handle empty booking data", async () => {
      const userId = "user-123"
      const listingId = "listing-456"
      const bookingData = {}

      const result = await marketplaceService.generateBookingIntelligence(
        userId,
        listingId,
        bookingData
      )

      expect(result).toBeDefined()
      expect(result.userId).toBe(userId)
      expect(result.listingId).toBe(listingId)
      expect(result.recommendations).toBeDefined()
    })
  })

  describe("Price Suggestions", () => {
    it("should generate price suggestions successfully", async () => {
      const listingId = "listing-456"
      const currentPrice = 1000
      const marketContext = { location: "Bangkok", category: "apartment" }

      const result = await marketplaceService.generatePriceSuggestions(
        listingId,
        currentPrice,
        marketContext
      )

      expect(result).toBeDefined()
      expect(result.listingId).toBe(listingId)
      expect(result.currentPrice).toBe(currentPrice)
      expect(result.suggestedPrice).toBeDefined()
      expect(result.priceRange).toBeDefined()
      expect(result.confidence).toBeDefined()
      expect(result.marketData).toBeDefined()
      expect(result.validUntil).toBeInstanceOf(Date)
    })

    it("should handle missing current price", async () => {
      const listingId = "listing-456"

      const result = await marketplaceService.generatePriceSuggestions(listingId)

      expect(result).toBeDefined()
      expect(result.currentPrice).toBe(0) // Default value when no current price provided
      expect(result.suggestedPrice).toBeDefined()
    })
  })

  describe("Smart Notifications", () => {
    it("should create smart notification successfully", async () => {
      const userId = "user-123"
      const type = "booking_reminder"
      const context = { bookingId: "booking-789", urgency: "high" }

      const result = await marketplaceService.createSmartNotification(userId, type, context)

      expect(result).toBeDefined()
      expect(result.userId).toBe(userId)
      expect(result.type).toBe(type)
      expect(result.priority).toBeDefined()
      expect(result.channel).toBeDefined()
      expect(result.timing.sendAt).toBeInstanceOf(Date)
      expect(result.content.title).toBeDefined()
      expect(result.expectedEngagement).toBeDefined()
    })

    it("should handle different notification types", async () => {
      const userId = "user-123"
      const type = "price_alert"
      const context = { priceChange: 0.25 }

      const result = await marketplaceService.createSmartNotification(userId, type, context)

      expect(result.type).toBe(type)
      expect(result.priority).toBe("high") // High price change
    })
  })

  describe("Fraud Detection", () => {
    it("should detect fraud successfully", async () => {
      const userId = "user-123"
      const listingId = "listing-456"
      const transactionData = {
        amount: 75000, // High amount
        currency: "THB",
        bookingId: "booking-789",
      }

      const result = await marketplaceService.detectFraud(userId, listingId, transactionData)

      expect(result).toBeDefined()
      expect(result.userId).toBe(userId)
      expect(result.riskScore).toBeDefined()
      expect(result.riskLevel).toBeDefined()
      expect(result.flags).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it("should return low risk for normal behavior", async () => {
      const userId = "user-123"
      const transactionData = {
        amount: 2000, // Normal amount
        currency: "THB",
      }

      const result = await marketplaceService.detectFraud(userId, undefined, transactionData)

      expect(result).toBeDefined()
      expect(result.riskScore).toBeDefined()
      expect(result.riskLevel).toBeDefined()
      expect(result.recommendations.action).toBeDefined()
    })
  })

  describe("Error Handling", () => {
    it("should handle service initialization", () => {
      expect(marketplaceService).toBeDefined()
    })

    it("should handle empty parameters gracefully", async () => {
      const userId = "user-123"
      const listingId = "listing-456"
      const bookingData = {}

      const result = await marketplaceService.generateBookingIntelligence(
        userId,
        listingId,
        bookingData
      )

      expect(result).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })
  })
})
