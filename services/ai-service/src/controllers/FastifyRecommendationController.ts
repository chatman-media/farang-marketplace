import { FastifyRequest, FastifyReply } from "fastify"
import { RecommendationEngine } from "../services/RecommendationEngine"

export class FastifyRecommendationController {
  private recommendationEngine: RecommendationEngine

  constructor(recommendationEngine: RecommendationEngine) {
    this.recommendationEngine = recommendationEngine
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const userId = request.user?.id
      if (!userId) {
        reply.status(400)
        return {
          success: false,
          message: "User ID is required",
        }
      }

      const query = request.query as any
      const recommendationRequest = {
        userId,
        type: query.type || "listings",
        context: {
          currentListingId: query.currentListingId || "",
          searchQuery: query.searchQuery,
          category: query.category,
          location: query.location,
          budget: query.budget ? parseFloat(query.budget) : 0,
        },
        filters: {
          categories: query.categories ? query.categories.split(",") : [],
          priceRange:
            query.minPrice && query.maxPrice
              ? {
                  min: parseFloat(query.minPrice),
                  max: parseFloat(query.maxPrice),
                }
              : undefined,
          location: query.location,
        },
        limit: query.limit ? parseInt(query.limit) : 10,
        includeViewed: query.includeViewed === "true",
      }

      const recommendations = await this.recommendationEngine.getRecommendations(recommendationRequest)

      return {
        success: true,
        data: recommendations,
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
          type: recommendationRequest.type,
        },
      }
    } catch (error) {
      request.log.error("Error getting recommendations:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get recommendations",
      }
    }
  }

  /**
   * Update user behavior for recommendation improvement
   */
  async updateUserBehavior(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const userId = request.user?.id
      if (!userId) {
        reply.status(400)
        return {
          success: false,
          message: "User ID is required",
        }
      }

      const body = request.body as any
      const behaviorData = {
        userId,
        action: body.action,
        itemId: body.itemId,
        category: body.category,
        timestamp: new Date(),
        metadata: body.metadata || {},
      }

      await this.recommendationEngine.updateUserBehavior(behaviorData)

      return {
        success: true,
        message: "User behavior updated successfully",
        data: {
          userId,
          action: behaviorData.action,
          itemId: behaviorData.itemId,
          timestamp: behaviorData.timestamp,
        },
      }
    } catch (error) {
      request.log.error("Error updating user behavior:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to update user behavior",
      }
    }
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const stats = this.recommendationEngine.getStats()

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      request.log.error("Error getting recommendation stats:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get recommendation statistics",
      }
    }
  }

  /**
   * Get similar items based on item ID
   */
  async getSimilarItems(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const params = request.params as any
      const query = request.query as any
      const itemId = params.itemId
      const limit = query.limit ? parseInt(query.limit) : 5

      if (!itemId) {
        reply.status(400)
        return {
          success: false,
          message: "Item ID is required",
        }
      }

      const similarItems = await this.recommendationEngine.getSimilarItems({
        itemId,
        limit,
        userId: request.user?.id,
      })

      return {
        success: true,
        data: similarItems,
        metadata: {
          itemId,
          limit,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      request.log.error("Error getting similar items:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get similar items",
      }
    }
  }

  /**
   * Get trending items
   */
  async getTrendingItems(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const query = request.query as any
      const category = query.category
      const location = query.location
      const limit = query.limit ? parseInt(query.limit) : 20
      const timeframe = query.timeframe || "24h"

      const trendingItems = await this.recommendationEngine.getTrendingItems({
        category,
        location,
        limit,
        timeframe,
      })

      return {
        success: true,
        data: trendingItems,
        metadata: {
          category,
          location,
          limit,
          timeframe,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      request.log.error("Error getting trending items:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get trending items",
      }
    }
  }

  /**
   * Get personalized categories for user
   */
  async getPersonalizedCategories(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const userId = request.user?.id
      if (!userId) {
        reply.status(400)
        return {
          success: false,
          message: "User ID is required",
        }
      }

      const categories = await this.recommendationEngine.getPersonalizedCategories(userId)

      return {
        success: true,
        data: categories,
        metadata: {
          userId,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      request.log.error("Error getting personalized categories:", error)
      reply.status(500)
      return {
        success: false,
        message: "Failed to get personalized categories",
      }
    }
  }
}
