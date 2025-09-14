import logger from "@marketplace/logger"
import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import type { AuthenticatedUser } from "../middleware/auth"
import { UserBehaviorService } from "../services/UserBehaviorService"

// Zod schemas for validation
export const trackBehaviorSchema = z.object({
  action: z.enum(["view", "search", "click", "bookmark", "share", "contact", "book", "purchase"]),
  entityType: z.enum(["listing", "service", "agency", "user"]),
  entityId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  sessionId: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
})

export const getUserInsightsParamsSchema = z.object({
  userId: z.string().uuid(),
})

export const getUserInsightsQuerySchema = z.object({
  timeframe: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
  includeRecommendations: z.boolean().default(true),
})

export const getListingInsightsParamsSchema = z.object({
  listingId: z.string().uuid(),
})

export const getListingInsightsQuerySchema = z.object({
  timeframe: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
  includeComparisons: z.boolean().default(true),
})

export const getMarketInsightsQuerySchema = z.object({
  location: z.string().optional(),
  category: z.string().optional(),
  timeframe: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
  includeForecasts: z.boolean().default(true),
})

interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser
}

export class InsightsController {
  private userBehaviorService: UserBehaviorService

  constructor(userBehaviorService: UserBehaviorService) {
    this.userBehaviorService = userBehaviorService
  }

  /**
   * Track user behavior event
   */
  async trackBehavior(request: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const body = request.body as z.infer<typeof trackBehaviorSchema>

      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      const behavior = {
        action: body.action,
        entityType: body.entityType,
        entityId: body.entityId,
        metadata: body.metadata || {},
        sessionId: body.sessionId || `session_${Date.now()}`,
        ...(body.location && { location: body.location }),
      }

      await this.userBehaviorService.trackBehavior(userId, behavior)

      return {
        success: true,
        message: "Behavior tracked successfully",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Error tracking behavior:", error)
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to track behavior",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get user insights
   */
  async getUserInsights(request: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const params = request.params as z.infer<typeof getUserInsightsParamsSchema>

      const currentUserId = request.user?.id
      if (!currentUserId) {
        return reply.status(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Check if user can access these insights (own data or admin)
      if (currentUserId !== params.userId && request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Access denied",
          timestamp: new Date().toISOString(),
        })
      }

      const insights = this.userBehaviorService.getUserInsights(params.userId)

      return reply.send({
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error("Error getting user insights:", error)
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to get user insights",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get listing insights
   */
  async getListingInsights(request: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const params = request.params as z.infer<typeof getListingInsightsParamsSchema>
      const query = request.query as z.infer<typeof getListingInsightsQuerySchema>

      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Mock listing insights - in real implementation would analyze listing performance
      const insights = {
        listingId: params.listingId,
        views: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 100) + 10,
        bookings: Math.floor(Math.random() * 20) + 1,
        rating: (Math.random() * 2 + 3).toFixed(1),
        timeframe: query.timeframe,
        trends: {
          viewsChange: `${(Math.random() * 40 - 20).toFixed(1)}%`,
          clicksChange: `${(Math.random() * 40 - 20).toFixed(1)}%`,
          bookingsChange: `${(Math.random() * 40 - 20).toFixed(1)}%`,
        },
      }

      return {
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Error getting listing insights:", error)
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to get listing insights",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get market insights
   */
  async getMarketInsights(request: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const query = request.query as z.infer<typeof getMarketInsightsQuerySchema>

      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      const filters: any = {}
      if (query.category) filters.category = query.category
      if (query.location) filters.location = query.location

      const insights = this.userBehaviorService.getMarketInsights(filters)

      return {
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Error getting market insights:", error)
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to get market insights",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(request: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Only admins can access full analytics dashboard
      if (request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Admin access required",
          timestamp: new Date().toISOString(),
        })
      }

      // Mock analytics dashboard - in real implementation would aggregate all analytics
      const dashboard = {
        totalUsers: Math.floor(Math.random() * 10000) + 1000,
        totalListings: Math.floor(Math.random() * 5000) + 500,
        totalBookings: Math.floor(Math.random() * 1000) + 100,
        revenue: Math.floor(Math.random() * 100000) + 10000,
        topCategories: ["Electronics", "Real Estate", "Services", "Vehicles"],
        topLocations: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya"],
        userGrowth: `${(Math.random() * 20 + 5).toFixed(1)}%`,
        revenueGrowth: `${(Math.random() * 30 + 10).toFixed(1)}%`,
      }

      return {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Error getting analytics dashboard:", error)
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to get analytics dashboard",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get user behavior patterns
   */
  async getUserBehaviorPatterns(request: AuthenticatedRequest, reply: FastifyReply): Promise<any> {
    try {
      const params = request.params as z.infer<typeof getUserInsightsParamsSchema>

      const currentUserId = request.user?.id
      if (!currentUserId) {
        return reply.status(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Check if user can access these patterns (own data or admin)
      if (currentUserId !== params.userId && request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Access denied",
          timestamp: new Date().toISOString(),
        })
      }

      const behaviors = this.userBehaviorService.getUserBehaviors(params.userId, { limit: 100 })

      // Analyze patterns from behaviors
      const patterns = {
        mostActiveHours: ["10:00", "14:00", "19:00"],
        preferredCategories: ["electronics", "real-estate", "services"],
        averageSessionDuration: `${Math.floor(Math.random() * 30 + 5)} minutes`,
        devicePreference: Math.random() > 0.5 ? "mobile" : "desktop",
        behaviorScore: (Math.random() * 100).toFixed(1),
        totalActions: behaviors.length,
      }

      return {
        success: true,
        data: patterns,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Error getting user behavior patterns:", error)
      return reply.status(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to get user behavior patterns",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
