import { FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { UserBehaviorService } from "../services/UserBehaviorService"
import type { AuthenticatedUser } from "../middleware/fastify-auth"

// Zod schemas for validation
export const trackBehaviorSchema = z.object({
  eventType: z.enum(["view", "click", "search", "booking", "favorite", "share", "contact"]),
  entityType: z.enum(["listing", "service", "user", "search", "page"]),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  sessionId: z.string().optional(),
  location: z.string().optional(),
  device: z.string().optional(),
  timestamp: z.string().datetime().optional(),
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

export class FastifyInsightsController {
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
        return reply.code(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      const behavior = {
        userId,
        eventType: body.eventType,
        entityType: body.entityType,
        entityId: body.entityId,
        metadata: body.metadata || {},
        sessionId: body.sessionId || `session_${Date.now()}`,
        location: body.location,
        device: body.device,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      }

      await this.userBehaviorService.trackBehavior(userId, behavior)

      return {
        success: true,
        message: "Behavior tracked successfully",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error tracking behavior:", error)
      return reply.code(500).send({
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
      const query = request.query as z.infer<typeof getUserInsightsQuerySchema>

      const currentUserId = request.user?.id
      if (!currentUserId) {
        return reply.code(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Check if user can access these insights (own data or admin)
      if (currentUserId !== params.userId && request.user?.role !== "admin") {
        return reply.code(403).send({
          success: false,
          message: "Access denied",
          timestamp: new Date().toISOString(),
        })
      }

      const insights = await this.userBehaviorService.getUserInsights(
        params.userId,
        query.timeframe,
        query.includeRecommendations,
      )

      return {
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error getting user insights:", error)
      return reply.code(500).send({
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
        return reply.code(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      const insights = await this.userBehaviorService.getListingInsights(
        params.listingId,
        query.timeframe,
        query.includeComparisons,
      )

      return {
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error getting listing insights:", error)
      return reply.code(500).send({
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
        return reply.code(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      const insights = await this.userBehaviorService.getMarketInsights(
        query.location,
        query.category,
        query.timeframe,
        query.includeForecasts,
      )

      return {
        success: true,
        data: insights,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error getting market insights:", error)
      return reply.code(500).send({
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
        return reply.code(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Only admins can access full analytics dashboard
      if (request.user?.role !== "admin") {
        return reply.code(403).send({
          success: false,
          message: "Admin access required",
          timestamp: new Date().toISOString(),
        })
      }

      const dashboard = await this.userBehaviorService.getAnalyticsDashboard()

      return {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error getting analytics dashboard:", error)
      return reply.code(500).send({
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
        return reply.code(401).send({
          success: false,
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
      }

      // Check if user can access these patterns (own data or admin)
      if (currentUserId !== params.userId && request.user?.role !== "admin") {
        return reply.code(403).send({
          success: false,
          message: "Access denied",
          timestamp: new Date().toISOString(),
        })
      }

      const patterns = await this.userBehaviorService.getUserBehaviorPatterns(params.userId)

      return {
        success: true,
        data: patterns,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error getting user behavior patterns:", error)
      return reply.code(500).send({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Failed to get user behavior patterns",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
