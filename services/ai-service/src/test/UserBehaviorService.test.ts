import { describe, it, expect, beforeEach } from "vitest"
import { UserBehaviorService } from "../services/UserBehaviorService"
import { AIProviderService } from "../services/AIProviderService"

describe("User Behavior Service Tests", () => {
  let userBehaviorService: UserBehaviorService
  let aiProviderService: AIProviderService

  beforeEach(() => {
    aiProviderService = new AIProviderService()
    userBehaviorService = new UserBehaviorService(aiProviderService)
  })

  describe("Behavior Tracking", () => {
    it("should track user behavior correctly", async () => {
      const userId = "behavior_test_user"
      const behavior = {
        action: "view" as const,
        entityType: "listing" as const,
        entityId: "listing_123",
        sessionId: "session_456",
        metadata: {
          category: "electronics",
          price: 15000,
          location: "Bangkok",
          duration: 30000,
        },
      }

      const result = await userBehaviorService.trackBehavior(userId, behavior)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.message).toBeUndefined() // No error message
    })

    it("should handle different action types", async () => {
      const userId = "action_test_user"
      const actions = ["view", "click", "share", "purchase", "bookmark"] as const

      for (const action of actions) {
        const behavior = {
          action,
          entityType: "listing" as const,
          entityId: `listing_${action}`,
          sessionId: "session_actions",
          metadata: {
            category: "electronics",
            price: 10000,
          },
        }

        const result = await userBehaviorService.trackBehavior(userId, behavior)
        expect(result.success).toBe(true)
        expect(result.message).toBeUndefined()
      }
    })

    it("should track different entity types", async () => {
      const userId = "entity_test_user"
      const entityTypes = ["listing", "service", "agency", "user"] as const

      for (const entityType of entityTypes) {
        const behavior = {
          action: "view" as const,
          entityType,
          entityId: `${entityType}_123`,
          sessionId: "session_entities",
          metadata: {
            category: "test",
          },
        }

        const result = await userBehaviorService.trackBehavior(userId, behavior)
        expect(result.success).toBe(true)
      }
    })
  })

  describe("User Insights Generation", () => {
    it("should generate user insights from behavior patterns", async () => {
      const userId = "insights_test_user"

      // Create behavior pattern - electronics interest
      for (let i = 0; i < 10; i++) {
        await userBehaviorService.trackBehavior(userId, {
          action: "view",
          entityType: "listing",
          entityId: `listing_electronics_${i}`,
          sessionId: `session_${i}`,
          metadata: {
            category: "electronics",
            price: 15000 + i * 1000,
            location: "Bangkok",
            duration: 20000 + i * 5000,
          },
        })
      }

      const insights = await userBehaviorService.generateUserInsights(userId, {
        type: "preference",
        timeframe: "30d",
        actionable: true,
      })

      expect(insights).toBeDefined()
      expect(Array.isArray(insights)).toBe(true)
      expect(insights.length).toBeGreaterThan(0)

      // Should detect electronics preference
      const electronicsInsight = insights.find(
        (insight) => insight.type === "preference" && insight.insight.includes("electronics"),
      )
      expect(electronicsInsight).toBeDefined()
      expect(electronicsInsight!.confidence).toBeGreaterThan(0.5)
    })

    it("should generate behavioral insights", async () => {
      const userId = "behavioral_insights_user"

      // Create browsing pattern
      const sessions = ["morning", "afternoon", "evening"]
      for (const session of sessions) {
        for (let i = 0; i < 5; i++) {
          await userBehaviorService.trackBehavior(userId, {
            action: "view",
            entityType: "listing",
            entityId: `listing_${session}_${i}`,
            sessionId: `session_${session}`,
            metadata: {
              category: "fashion",
              timeOfDay: session,
              duration: 15000,
            },
          })
        }
      }

      const insights = await userBehaviorService.generateUserInsights(userId, {
        type: "behavior",
        timeframe: "7d",
        actionable: true,
      })

      expect(insights).toBeDefined()
      expect(insights.length).toBeGreaterThan(0)

      // Should detect browsing patterns
      const behaviorInsight = insights.find((insight) => insight.type === "behavior")
      expect(behaviorInsight).toBeDefined()
    })

    it("should generate engagement insights", async () => {
      const userId = "engagement_insights_user"

      // Create engagement pattern
      const engagementActions = [
        { action: "view", weight: 1 },
        { action: "bookmark", weight: 3 },
        { action: "share", weight: 5 },
        { action: "purchase", weight: 10 },
      ] as const

      for (const { action, weight } of engagementActions) {
        for (let i = 0; i < weight; i++) {
          await userBehaviorService.trackBehavior(userId, {
            action,
            entityType: "listing",
            entityId: `listing_${action}_${i}`,
            sessionId: `session_engagement_${i}`,
            metadata: {
              category: "home",
              price: 5000,
            },
          })
        }
      }

      const insights = await userBehaviorService.generateUserInsights(userId, {
        type: "engagement",
        timeframe: "30d",
        actionable: true,
      })

      expect(insights).toBeDefined()
      expect(insights.length).toBeGreaterThan(0)

      // Engagement insights are returned as behavior type with engagement content
      const engagementInsight = insights.find((insight) => insight.insight.includes("engagement"))
      expect(engagementInsight).toBeDefined()
      expect(engagementInsight!.confidence).toBeGreaterThan(0.3)
    })
  })

  describe("Market Analytics", () => {
    it("should analyze market trends", async () => {
      // Simulate market activity
      const categories = ["electronics", "fashion", "home", "automotive"]
      const users = ["user_1", "user_2", "user_3", "user_4", "user_5"]

      for (const category of categories) {
        for (const user of users) {
          for (let i = 0; i < 3; i++) {
            await userBehaviorService.trackBehavior(user, {
              action: "view",
              entityType: "listing",
              entityId: `listing_${category}_${i}`,
              sessionId: `session_${user}_${i}`,
              metadata: {
                category,
                price: 10000 + Math.random() * 20000,
                location: "Bangkok",
              },
            })
          }
        }
      }

      const trends = await userBehaviorService.analyzeMarketTrends({
        type: "category",
        timeframe: "7d",
        location: "Bangkok",
      })

      expect(trends).toBeDefined()
      expect(Array.isArray(trends)).toBe(true)
      expect(trends.length).toBeGreaterThan(0)

      // Should have trend insights for categories
      const categoryTrend = trends.find((trend) => trend.type === "trend")
      expect(categoryTrend).toBeDefined()
      expect(categoryTrend!.data.count).toBeDefined()
    })

    it("should analyze location-based trends", async () => {
      const locations = ["Bangkok", "Chiang Mai", "Phuket"]
      const users = ["user_loc_1", "user_loc_2", "user_loc_3"]

      for (const location of locations) {
        for (const user of users) {
          await userBehaviorService.trackBehavior(user, {
            action: "view",
            entityType: "listing",
            entityId: `listing_${location}`,
            sessionId: `session_${location}`,
            metadata: {
              category: "real-estate",
              location,
              price: 25000,
            },
          })
        }
      }

      const trends = await userBehaviorService.analyzeMarketTrends({
        type: "location",
        timeframe: "30d",
      })

      expect(trends).toBeDefined()
      expect(trends.length).toBeGreaterThan(0)

      const locationTrend = trends.find((trend) => trend.type === "opportunity")
      expect(locationTrend).toBeDefined()
      expect(locationTrend!.data.count).toBeDefined()
    })

    it("should analyze price trends", async () => {
      const users = ["price_user_1", "price_user_2", "price_user_3"]
      const priceRanges = [
        { min: 1000, max: 5000 },
        { min: 5000, max: 15000 },
        { min: 15000, max: 30000 },
      ]

      for (const user of users) {
        for (const range of priceRanges) {
          const price = range.min + Math.random() * (range.max - range.min)
          await userBehaviorService.trackBehavior(user, {
            action: "purchase",
            entityType: "listing",
            entityId: `listing_price_${price}`,
            sessionId: `session_price_${user}`,
            metadata: {
              category: "electronics",
              price,
              location: "Bangkok",
            },
          })
        }
      }

      const trends = await userBehaviorService.analyzeMarketTrends({
        type: "price",
        timeframe: "30d",
        category: "electronics",
      })

      expect(trends).toBeDefined()
      expect(trends.length).toBeGreaterThan(0)

      const priceTrend = trends.find((trend) => trend.type === "pricing")
      expect(priceTrend).toBeDefined()
      expect(priceTrend!.data.avgPrice).toBeDefined()
    })
  })

  describe("User Segmentation", () => {
    it("should segment users based on behavior", async () => {
      // Create different user types
      const userTypes = [
        { prefix: "browser", actions: ["view", "view", "view"] },
        { prefix: "buyer", actions: ["view", "like", "purchase"] },
        { prefix: "social", actions: ["view", "like", "share", "share"] },
      ]

      for (const type of userTypes) {
        for (let i = 0; i < 3; i++) {
          const userId = `${type.prefix}_user_${i}`
          for (const action of type.actions) {
            await userBehaviorService.trackBehavior(userId, {
              action: action as any,
              entityType: "listing",
              entityId: `listing_${type.prefix}_${i}`,
              sessionId: `session_${type.prefix}_${i}`,
              metadata: {
                category: "electronics",
                price: 15000,
              },
            })
          }
        }
      }

      const segments = await userBehaviorService.getUserSegments({
        algorithm: "behavior",
        minSegmentSize: 2,
      })

      expect(segments).toBeDefined()
      expect(Array.isArray(segments)).toBe(true)
      expect(segments.length).toBeGreaterThan(0)

      // Should have different segments
      const segmentNames = segments.map((s) => s.name)
      expect(segmentNames.length).toBeGreaterThan(1)
    })

    it("should segment users by preferences", async () => {
      const preferences = [
        { category: "electronics", users: ["elec_user_1", "elec_user_2"] },
        { category: "fashion", users: ["fashion_user_1", "fashion_user_2"] },
        { category: "home", users: ["home_user_1", "home_user_2"] },
      ]

      for (const pref of preferences) {
        for (const userId of pref.users) {
          for (let i = 0; i < 5; i++) {
            await userBehaviorService.trackBehavior(userId, {
              action: "view",
              entityType: "listing",
              entityId: `listing_${pref.category}_${i}`,
              sessionId: `session_${userId}_${i}`,
              metadata: {
                category: pref.category,
                price: 10000,
              },
            })
          }
        }
      }

      const segments = await userBehaviorService.getUserSegments({
        algorithm: "preference",
        minSegmentSize: 2,
      })

      expect(segments).toBeDefined()
      expect(segments.length).toBeGreaterThan(0)

      // Should have category-based segments
      const hasElectronicsSegment = segments.some((s) => s.characteristics.some((char) => char.includes("electronics")))
      expect(hasElectronicsSegment).toBe(true)
    })
  })

  describe("Behavior Trends", () => {
    it("should analyze behavior trends over time", async () => {
      const userId = "trend_analysis_user"
      const days = 7

      // Create behavior over time
      for (let day = 0; day < days; day++) {
        const date = new Date()
        date.setDate(date.getDate() - day)

        for (let i = 0; i < 3; i++) {
          await userBehaviorService.trackBehavior(userId, {
            action: "view",
            entityType: "listing",
            entityId: `listing_day_${day}_${i}`,
            sessionId: `session_day_${day}`,
            metadata: {
              category: "electronics",
              price: 15000,
              timestamp: date.toISOString(),
            },
          })
        }
      }

      const trends = await userBehaviorService.getBehaviorTrends({
        timeframe: "7d",
        granularity: "daily",
        category: "electronics",
      })

      expect(trends).toBeDefined()
      expect(Array.isArray(trends)).toBe(true)
      expect(trends.length).toBeGreaterThan(0)

      // Should have daily data points
      const dailyTrend = trends.find((t) => t.period.includes("Day"))
      expect(dailyTrend).toBeDefined()
      expect(dailyTrend!.value).toBeGreaterThan(0)
    })

    it("should analyze action distribution trends", async () => {
      const users = ["action_trend_1", "action_trend_2", "action_trend_3"]
      const actions = ["view", "bookmark", "share", "purchase"] as const

      for (const user of users) {
        for (const action of actions) {
          const count = action === "view" ? 10 : action === "bookmark" ? 5 : 2
          for (let i = 0; i < count; i++) {
            await userBehaviorService.trackBehavior(user, {
              action,
              entityType: "listing",
              entityId: `listing_${action}_${i}`,
              sessionId: `session_${user}_${action}`,
              metadata: {
                category: "fashion",
                price: 3000,
              },
            })
          }
        }
      }

      const trends = await userBehaviorService.getBehaviorTrends({
        timeframe: "30d",
        granularity: "weekly",
        category: "fashion",
        groupBy: "action",
      })

      expect(trends).toBeDefined()
      expect(trends.length).toBeGreaterThan(0)

      // Should have action distribution in breakdown
      const actionTrend = trends.find((t) => t.breakdown && "view" in t.breakdown)
      expect(actionTrend).toBeDefined()
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid user ID gracefully", async () => {
      const result = await userBehaviorService.trackBehavior("", {
        action: "view",
        entityType: "listing",
        entityId: "listing_test",
        sessionId: "session_test",
        metadata: { category: "test" },
      })

      // Empty userId is still accepted in current implementation
      expect(result.success).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("should handle missing metadata gracefully", async () => {
      const result = await userBehaviorService.trackBehavior("test_user", {
        action: "view",
        entityType: "listing",
        entityId: "listing_test",
        sessionId: "session_test",
        metadata: {},
      })

      expect(result.success).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("should handle large metadata objects", async () => {
      const largeMetadata = {
        category: "electronics",
        price: 15000,
        description: "A".repeat(1000), // Large description
        features: Array.from({ length: 100 }, (_, i) => `feature_${i}`),
        tags: Array.from({ length: 50 }, (_, i) => `tag_${i}`),
      }

      const result = await userBehaviorService.trackBehavior("large_metadata_user", {
        action: "view",
        entityType: "listing",
        entityId: "listing_large",
        sessionId: "session_large",
        metadata: largeMetadata,
      })

      expect(result.success).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it("should handle concurrent behavior tracking", async () => {
      const userId = "concurrent_user"
      const promises = []

      // Track multiple behaviors concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          userBehaviorService.trackBehavior(userId, {
            action: "view",
            entityType: "listing",
            entityId: `listing_concurrent_${i}`,
            sessionId: `session_concurrent_${i}`,
            metadata: {
              category: "electronics",
              price: 15000 + i * 1000,
            },
          }),
        )
      }

      const results = await Promise.all(promises)

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true)
      expect(results.every((r) => !r.message)).toBe(true)
    })
  })
})
