import { FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { UserBehaviorService } from "../services/UserBehaviorService"
import type { AuthenticatedUser } from "../middleware/fastify-auth"

// Zod schemas for validation
export const trackBehaviorSchema = z.object({
  action: z.enum(["view", "search", "click", "bookmark", "share", "contact", "book", "purchase"]),
  entityType: z.enum(["listing", "service", "agency", "user"]),
  entityId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  device: z
    .object({
      type: z.enum(["mobile", "tablet", "desktop"]),
      os: z.string().optional(),
      browser: z.string().optional(),
    })
    .optional(),
  userId: z.string().optional(),
})

export const userInsightsParamsSchema = z.object({
  userId: z.string().min(1).optional(),
})

export const userInsightsQuerySchema = z.object({
  type: z.enum(["preference", "behavior", "prediction", "segment"]).optional(),
  actionable: z.boolean().optional(),
})

export const marketInsightsQuerySchema = z.object({
  type: z.enum(["trend", "demand", "pricing", "competition", "opportunity"]).optional(),
  category: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
})

export const behaviorTrendsQuerySchema = z.object({
  timeframe: z.enum(["1d", "7d", "30d", "90d"]).optional(),
  category: z.string().min(1).optional(),
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
  async trackBehavior(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = trackBehaviorSchema.parse(request.body)

      const userId = request.user?.id || body.userId
      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: "User ID is required",
        })
      }

      const behavior = {
        action: body.action,
        entityType: body.entityType,
        entityId: body.entityId,
        metadata: body.metadata || {},
        sessionId: body.sessionId || `session_${Date.now()}`,
        ...(body.location && { location: body.location }),
        ...(body.device && { device: body.device }),
      }

      await this.userBehaviorService.trackBehavior(userId, behavior)

      reply.send({
        success: true,
        message: "Behavior tracked successfully",
        data: {
          behaviorId: `behavior_${Date.now()}`,
          userId,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        })
      }

      console.error("Error tracking behavior:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to track behavior",
      })
    }
  }

  /**
   * Get user insights
   */
  async getUserInsights(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = userInsightsParamsSchema.parse(request.params)
      const query = userInsightsQuerySchema.parse(request.query)

      const userId = params.userId || request.user?.id
      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: "User ID is required",
        })
      }

      // Check authorization - users can only see their own insights, admins can see all
      if (request.user?.role !== "admin" && request.user?.id !== userId) {
        return reply.status(403).send({
          success: false,
          message: "Access denied",
        })
      }

      const insights = this.userBehaviorService.getUserInsights(userId)

      // Filter insights by type if requested
      const typeFilter = query.type
      const filteredInsights = typeFilter ? insights.filter((insight) => insight.type === typeFilter) : insights

      // Filter actionable insights if requested
      const actionableOnly = query.actionable
      const finalInsights = actionableOnly ? filteredInsights.filter((insight) => insight.actionable) : filteredInsights

      reply.send({
        success: true,
        message: `Found ${finalInsights.length} insights`,
        data: {
          userId,
          insights: finalInsights,
          totalInsights: insights.length,
          actionableInsights: insights.filter((i) => i.actionable).length,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        })
      }

      console.error("Error getting user insights:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get user insights",
      })
    }
  }

  /**
   * Analyze user behavior and generate insights
   */
  async analyzeUserBehavior(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = userInsightsParamsSchema.parse(request.params)

      const userId = params.userId || request.user?.id
      if (!userId) {
        return reply.status(400).send({
          success: false,
          message: "User ID is required",
        })
      }

      // Check authorization
      if (request.user?.role !== "admin" && request.user?.id !== userId) {
        return reply.status(403).send({
          success: false,
          message: "Access denied",
        })
      }

      const insights = await this.userBehaviorService.analyzeUserBehavior(userId)

      reply.send({
        success: true,
        message: `Generated ${insights.length} insights`,
        data: {
          userId,
          insights,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        })
      }

      console.error("Error analyzing user behavior:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze user behavior",
      })
    }
  }

  /**
   * Get market insights
   */
  async getMarketInsights(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = marketInsightsQuerySchema.parse(request.query)

      // Only admins can access market insights
      if (request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Admin access required",
        })
      }

      const filters = {
        type: query.type,
        category: query.category,
        location: query.location,
        minConfidence: query.minConfidence,
      }

      // Remove undefined values and create clean filters
      const cleanFilters: { type?: string; category?: string; location?: string; minConfidence?: number } = {}
      if (query.type) cleanFilters.type = query.type
      if (query.category) cleanFilters.category = query.category
      if (query.location) cleanFilters.location = query.location
      if (query.minConfidence !== undefined) cleanFilters.minConfidence = query.minConfidence

      const insights = this.userBehaviorService.getMarketInsights(
        Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
      )

      reply.send({
        success: true,
        message: `Found ${insights.length} market insights`,
        data: {
          insights,
          filters,
          totalInsights: insights.length,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.errors,
        })
      }

      console.error("Error getting market insights:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get market insights",
      })
    }
  }

  /**
   * Generate market insights
   */
  async generateMarketInsights(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      // Only admins can generate market insights
      if (request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Admin access required",
        })
      }

      const insights = await this.userBehaviorService.generateMarketInsights()

      reply.send({
        success: true,
        message: `Generated ${insights.length} market insights`,
        data: {
          insights,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Error generating market insights:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate market insights",
      })
    }
  }

  /**
   * Get behavior statistics
   */
  async getBehaviorStats(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      // Only admins can access behavior stats
      if (request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Admin access required",
        })
      }

      const stats = this.userBehaviorService.getStats()

      reply.send({
        success: true,
        message: "Behavior statistics retrieved",
        data: stats,
      })
    } catch (error) {
      console.error("Error getting behavior stats:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get behavior statistics",
      })
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      // Only admins can access user segments
      if (request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Admin access required",
        })
      }

      const segments = await this.userBehaviorService.getUserSegments({
        algorithm: "behavior",
        minSegmentSize: 10,
      })

      reply.send({
        success: true,
        message: `Found ${segments.length} user segments`,
        data: {
          segments,
          totalSegments: segments.length,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Error getting user segments:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get user segments",
      })
    }
  }

  /**
   * Get behavior trends
   */
  async getBehaviorTrends(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = behaviorTrendsQuerySchema.parse(request.query)

      // Only admins can access behavior trends
      if (request.user?.role !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Admin access required",
        })
      }

      const timeframe = query.timeframe || "7d"
      const category = query.category

      const granularity = timeframe === "1d" ? "daily" : "weekly"
      const trends = await this.userBehaviorService.getBehaviorTrends({
        timeframe,
        granularity,
        ...(category && { category }),
      })

      reply.send({
        success: true,
        message: "Behavior trends retrieved",
        data: {
          trends,
          timeframe,
          category,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: error.errors,
        })
      }

      console.error("Error getting behavior trends:", error)
      reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get behavior trends",
      })
    }
  }
}
