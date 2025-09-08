import { Request, Response } from "express"
import { body, param, query, validationResult } from "express-validator"
import { UserBehaviorService } from "../services/UserBehaviorService"
import type { AuthenticatedRequest } from "../middleware/auth"

export class InsightsController {
  private userBehaviorService: UserBehaviorService

  constructor(userBehaviorService: UserBehaviorService) {
    this.userBehaviorService = userBehaviorService
  }

  /**
   * Track user behavior event
   */
  async trackBehavior(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const userId = req.user?.id || req.body.userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        })
      }

      const behavior = {
        userId,
        action: req.body.action,
        entityType: req.body.entityType,
        entityId: req.body.entityId,
        metadata: req.body.metadata || {},
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        location: req.body.location,
        device: req.body.device,
      }

      await this.userBehaviorService.trackBehavior(req.body.userId, behavior)

      res.json({
        success: true,
        message: "Behavior tracked successfully",
      })
    } catch (error) {
      console.error("Error tracking behavior:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to track behavior",
      })
    }
  }

  /**
   * Get user insights
   */
  async getUserInsights(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const userId = req.user?.id || req.params["userId"]
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        })
      }

      // Check authorization - users can only see their own insights, admins can see all
      if (req.user?.id !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const insights = this.userBehaviorService.getUserInsights(userId)

      // Filter insights by type if requested
      const typeFilter = req.query["type"] as string
      const filteredInsights = typeFilter ? insights.filter((insight) => insight.type === typeFilter) : insights

      // Filter by actionable if requested
      const actionableOnly = req.query["actionable"] === "true"
      const finalInsights = actionableOnly ? filteredInsights.filter((insight) => insight.actionable) : filteredInsights

      res.json({
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
      console.error("Error getting user insights:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get user insights",
      })
    }
  }

  /**
   * Analyze user behavior and generate insights
   */
  async analyzeUserBehavior(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const userId = req.user?.id || req.params["userId"]
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        })
      }

      // Check authorization
      if (req.user?.id !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const insights = await this.userBehaviorService.analyzeUserBehavior(userId)

      res.json({
        success: true,
        message: `Generated ${insights.length} insights`,
        data: {
          userId,
          insights,
          analysisTimestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error analyzing user behavior:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze user behavior",
      })
    }
  }

  /**
   * Get market insights
   */
  async getMarketInsights(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      // Only admins can access market insights
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        })
      }

      const filters: {
        type?: string
        category?: string
        location?: string
        minConfidence?: number
      } = {
        type: req.query["type"] as string,
        category: req.query["category"] as string,
        location: req.query["location"] as string,
      }

      if (req.query["minConfidence"]) {
        filters.minConfidence = parseFloat(req.query["minConfidence"] as string)
      }

      const insights = this.userBehaviorService.getMarketInsights(filters)

      res.json({
        success: true,
        message: `Found ${insights.length} market insights`,
        data: {
          insights,
          filters,
          totalInsights: insights.length,
        },
      })
    } catch (error) {
      console.error("Error getting market insights:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get market insights",
      })
    }
  }

  /**
   * Generate market insights
   */
  async generateMarketInsights(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      // Only admins can generate market insights
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        })
      }

      const insights = await this.userBehaviorService.generateMarketInsights()

      res.json({
        success: true,
        message: `Generated ${insights.length} market insights`,
        data: {
          insights,
          generationTimestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error generating market insights:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate market insights",
      })
    }
  }

  /**
   * Get user behavior statistics
   */
  async getBehaviorStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userId = req.user?.id || (req.query["userId"] as string)

      // Check authorization
      if (userId && req.user?.id !== userId && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const stats = this.userBehaviorService.getStats()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error("Error getting behavior stats:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get behavior statistics",
      })
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      // Only admins can access user segments
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        })
      }

      // Mock user segments - in real implementation would analyze all users
      const segments = [
        {
          segment: "high_value",
          description: "Users with high spending potential",
          userCount: 1250,
          characteristics: ["High budget", "Frequent purchases", "Premium preferences"],
          recommendations: ["Offer premium services", "Provide VIP support"],
        },
        {
          segment: "tech_enthusiasts",
          description: "Users interested in technology products",
          userCount: 3400,
          characteristics: ["Electronics category preference", "Early adopters", "High engagement"],
          recommendations: ["Show latest tech products", "Tech-focused promotions"],
        },
        {
          segment: "budget_conscious",
          description: "Price-sensitive users",
          userCount: 5600,
          characteristics: ["Low to medium budget", "Deal seekers", "Price comparisons"],
          recommendations: ["Highlight discounts", "Show budget options"],
        },
        {
          segment: "new_users",
          description: "Recently registered users",
          userCount: 890,
          characteristics: ["Low activity", "Exploring platform", "Need guidance"],
          recommendations: ["Onboarding assistance", "Welcome offers"],
        },
      ]

      res.json({
        success: true,
        message: `Found ${segments.length} user segments`,
        data: {
          segments,
          totalUsers: segments.reduce((sum, seg) => sum + seg.userCount, 0),
          analysisDate: new Date(),
        },
      })
    } catch (error) {
      console.error("Error getting user segments:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get user segments",
      })
    }
  }

  /**
   * Get behavior trends
   */
  async getBehaviorTrends(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      // Only admins can access behavior trends
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        })
      }

      const timeframe = (req.query["timeframe"] as string) || "7d"
      const category = req.query["category"] as string

      // Mock behavior trends - in real implementation would analyze actual data
      const trends = [
        {
          action: "view",
          trend: "increasing",
          change: "+15%",
          period: timeframe,
          category: category || "all",
          data: [100, 105, 110, 115, 120, 125, 130],
        },
        {
          action: "purchase",
          trend: "stable",
          change: "+2%",
          period: timeframe,
          category: category || "all",
          data: [20, 21, 20, 22, 21, 22, 23],
        },
        {
          action: "search",
          trend: "decreasing",
          change: "-8%",
          period: timeframe,
          category: category || "all",
          data: [80, 78, 75, 73, 70, 68, 65],
        },
      ]

      res.json({
        success: true,
        message: `Found ${trends.length} behavior trends`,
        data: {
          trends,
          timeframe,
          category: category || "all",
          analysisDate: new Date(),
        },
      })
    } catch (error) {
      console.error("Error getting behavior trends:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get behavior trends",
      })
    }
  }
}

// Validation rules
export const trackBehaviorValidation = [
  body("action")
    .isIn(["view", "search", "click", "bookmark", "share", "contact", "book", "purchase"])
    .withMessage("Invalid action"),
  body("entityType").isIn(["listing", "service", "agency", "user"]).withMessage("Invalid entity type"),
  body("entityId").isLength({ min: 1 }).withMessage("Entity ID is required"),
  body("sessionId").optional().isLength({ min: 1 }).withMessage("Session ID must not be empty"),
  body("metadata").optional().isObject().withMessage("Metadata must be an object"),
]

export const userInsightsValidation = [
  param("userId").optional().isLength({ min: 1 }).withMessage("User ID must not be empty"),
  query("type")
    .optional()
    .isIn(["preference", "behavior", "prediction", "segment"])
    .withMessage("Invalid insight type"),
  query("actionable").optional().isBoolean().withMessage("Actionable must be boolean"),
]

export const marketInsightsValidation = [
  query("type")
    .optional()
    .isIn(["trend", "demand", "pricing", "competition", "opportunity"])
    .withMessage("Invalid insight type"),
  query("category").optional().isLength({ min: 1 }).withMessage("Category must not be empty"),
  query("location").optional().isLength({ min: 1 }).withMessage("Location must not be empty"),
  query("minConfidence").optional().isFloat({ min: 0, max: 1 }).withMessage("Min confidence must be between 0 and 1"),
]

export const behaviorTrendsValidation = [
  query("timeframe").optional().isIn(["1d", "7d", "30d", "90d"]).withMessage("Invalid timeframe"),
  query("category").optional().isLength({ min: 1 }).withMessage("Category must not be empty"),
]
