import { FastifyRequest, FastifyReply } from "fastify"
import { RecommendationEngine } from "../services/RecommendationEngine"

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    role: "user" | "admin" | "agency_owner" | "agency_manager"
  }
}

export class RecommendationController {
  private recommendationEngine: RecommendationEngine

  constructor(recommendationEngine: RecommendationEngine) {
    this.recommendationEngine = recommendationEngine
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(req: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const body = req.body as any
      const userId = req.user?.id || body?.userId
      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: "User ID is required",
        })
      }

      const query = req.query as any
      const request = {
        userId,
        type: query?.type || "listings",
        context: {
          currentListingId: query?.currentListingId || "",
          searchQuery: query?.searchQuery || "",
          category: query?.category || "",
          location: query?.location || "",
          budget: query?.budget ? parseFloat(query.budget) : 0,
        },
        filters: {
          categories: query?.categories ? query.categories.split(",") : [],
          priceRange:
            query?.minPrice && query?.maxPrice
              ? {
                  min: parseFloat(query.minPrice),
                  max: parseFloat(query.maxPrice),
                }
              : { min: 0, max: 999999 },
          location: query?.filterLocation || "",
          rating: query?.minRating ? parseFloat(query.minRating) : 0,
          availability: query?.availability === "true",
        },
        limit: query?.limit ? parseInt(query.limit) : 20,
        diversityFactor: query?.diversityFactor ? parseFloat(query.diversityFactor) : 0.3,
      }

      const recommendations = await this.recommendationEngine.generateRecommendations(request)

      return reply.send({
        success: true,
        message: `Generated ${recommendations.results.length} recommendations`,
        data: recommendations,
      })
    } catch (error) {
      console.error("Error getting recommendations:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get recommendations",
      })
    }
  }

  /**
   * Update user behavior for recommendation improvement
   */
  async updateUserBehavior(req: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const body = req.body as any
      const userId = req.user?.id || body?.userId
      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: "User ID is required",
        })
      }

      const behavior = {
        id: `behavior_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        action: body?.action,
        entityType: body?.entityType,
        entityId: body?.entityId,
        metadata: body?.metadata || {},
        sessionId: body?.sessionId || `session_${Date.now()}`,
        location: body?.location,
        device: body?.device,
        timestamp: new Date(),
      }

      await this.recommendationEngine.updateUserBehavior(behavior)

      return reply.send({
        success: true,
        message: "User behavior updated successfully",
      })
    } catch (error) {
      console.error("Error updating user behavior:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update user behavior",
      })
    }
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(_req: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const stats = this.recommendationEngine.getStats()

      return reply.send({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error("Error getting recommendation stats:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get recommendation statistics",
      })
    }
  }

  /**
   * Get similar items based on item ID
   */
  async getSimilarItems(req: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const params = req.params as any
      const query = req.query as any
      const { itemId } = params
      const userId = req.user?.id
      const limit = query?.limit ? parseInt(query.limit) : 10

      // Create a recommendation request based on the item
      const request = {
        userId: userId || "anonymous",
        type: query?.type || "listings",
        context: {
          currentListingId: itemId || "",
          searchQuery: "",
          category: "",
          location: "",
          budget: 0,
        },
        limit,
        diversityFactor: 0.1, // Lower diversity for similar items
      }

      const recommendations = await this.recommendationEngine.generateRecommendations(request)

      return reply.send({
        success: true,
        message: `Found ${recommendations.results.length} similar items`,
        data: {
          itemId,
          similarItems: recommendations.results,
          algorithm: recommendations.algorithm,
          processingTime: recommendations.processingTime,
        },
      })
    } catch (error) {
      console.error("Error getting similar items:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get similar items",
      })
    }
  }

  /**
   * Get trending items
   */
  async getTrendingItems(req: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const query = req.query as any
      const category = query?.category
      const location = query?.location
      const limit = query?.limit ? parseInt(query.limit) : 20

      // Mock trending items - in real implementation would use actual trending data
      const trendingItems = Array.from({ length: limit }, (_, i) => ({
        id: `trending_${i}`,
        type: "listing",
        score: 0.9 - i * 0.02,
        confidence: 0.8,
        reasons: ["High engagement", "Recent popularity surge"],
        metadata: {
          title: `Trending Item ${i + 1}`,
          category: category || "electronics",
          location: location || "Bangkok",
          trendScore: 0.9 - i * 0.02,
        },
        rank: i + 1,
      }))

      return reply.send({
        success: true,
        message: `Found ${trendingItems.length} trending items`,
        data: {
          items: trendingItems,
          category,
          location,
          algorithm: "trending_analysis",
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error getting trending items:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get trending items",
      })
    }
  }

  /**
   * Get personalized categories for user
   */
  async getPersonalizedCategories(req: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: "User ID is required",
        })
      }

      // Mock personalized categories - in real implementation would analyze user behavior
      const categories = [
        { category: "electronics", score: 0.9, reason: "Frequently viewed" },
        { category: "home", score: 0.7, reason: "Recent purchases" },
        { category: "fashion", score: 0.6, reason: "Seasonal interest" },
        { category: "automotive", score: 0.4, reason: "Occasional browsing" },
      ]

      return reply.send({
        success: true,
        message: `Found ${categories.length} personalized categories`,
        data: {
          userId,
          categories,
          algorithm: "behavior_analysis",
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error getting personalized categories:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get personalized categories",
      })
    }
  }
}

// Validation schemas for Fastify (to be implemented with JSON Schema or Zod)
//
// getRecommendations query parameters:
// - type: optional, one of ["listings", "services", "agencies", "users"]
// - limit: optional, integer between 1 and 100
// - diversityFactor: optional, float between 0 and 1
// - minRating: optional, float between 0 and 5
//
// updateBehavior body parameters:
// - action: required, one of ["view", "search", "click", "bookmark", "share", "contact", "book", "purchase"]
// - entityType: required, one of ["listing", "service", "agency", "user"]
// - entityId: required, non-empty string
// - sessionId: optional, non-empty string
//
// getSimilarItems parameters:
// - itemId: required path parameter, non-empty string
// - type: optional query, one of ["listings", "services", "agencies"]
// - limit: optional query, integer between 1 and 50
//
// getTrendingItems query parameters:
// - category: optional, non-empty string
// - location: optional, non-empty string
// - limit: optional, integer between 1 and 100
