import { Request, Response } from "express"
import { body, param, query, validationResult } from "express-validator"
import { RecommendationEngine } from "../services/RecommendationEngine"
import type { AuthenticatedRequest } from "../middleware/auth"

export class RecommendationController {
  private recommendationEngine: RecommendationEngine

  constructor(recommendationEngine: RecommendationEngine) {
    this.recommendationEngine = recommendationEngine
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<any> {
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

      const request = {
        userId,
        type: (req.query["type"] as any) || "listings",
        context: {
          currentListingId: (req.query["currentListingId"] as string) || "",
          searchQuery: req.query["searchQuery"] as string,
          category: req.query["category"] as string,
          location: req.query["location"] as string,
          budget: req.query["budget"] ? parseFloat(req.query["budget"] as string) : 0,
        },
        filters: {
          categories: req.query["categories"] ? (req.query["categories"] as string).split(",") : [],
          priceRange:
            req.query["minPrice"] && req.query["maxPrice"]
              ? {
                  min: parseFloat(req.query["minPrice"] as string),
                  max: parseFloat(req.query["maxPrice"] as string),
                }
              : { min: 0, max: 999999 },
          location: req.query["filterLocation"] as string,
          rating: req.query["minRating"] ? parseFloat(req.query["minRating"] as string) : 0,
          availability: req.query["availability"] === "true",
        },
        limit: req.query["limit"] ? parseInt(req.query["limit"] as string) : 20,
        diversityFactor: req.query["diversityFactor"]
          ? parseFloat(req.query["diversityFactor"] as string)
          : 0.3,
      }

      const recommendations = await this.recommendationEngine.generateRecommendations(request)

      res.json({
        success: true,
        message: `Generated ${recommendations.results.length} recommendations`,
        data: recommendations,
      })
    } catch (error) {
      console.error("Error getting recommendations:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get recommendations",
      })
    }
  }

  /**
   * Update user behavior for recommendation improvement
   */
  async updateUserBehavior(req: AuthenticatedRequest, res: Response): Promise<any> {
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
        id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: req.body.action,
        entityType: req.body.entityType,
        entityId: req.body.entityId,
        metadata: req.body.metadata || {},
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        location: req.body.location,
        device: req.body.device,
        timestamp: new Date(),
      }

      await this.recommendationEngine.updateUserBehavior(behavior)

      res.json({
        success: true,
        message: "User behavior updated successfully",
      })
    } catch (error) {
      console.error("Error updating user behavior:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update user behavior",
      })
    }
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const stats = this.recommendationEngine.getStats()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error("Error getting recommendation stats:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get recommendation statistics",
      })
    }
  }

  /**
   * Get similar items based on item ID
   */
  async getSimilarItems(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { itemId } = req.params
      const userId = req.user?.id
      const limit = req.query["limit"] ? parseInt(req.query["limit"] as string) : 10

      // Create a recommendation request based on the item
      const request = {
        userId: userId || "anonymous",
        type: (req.query["type"] as any) || "listings",
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

      res.json({
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
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get similar items",
      })
    }
  }

  /**
   * Get trending items
   */
  async getTrendingItems(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const category = req.query["category"] as string
      const location = req.query["location"] as string
      const limit = req.query["limit"] ? parseInt(req.query["limit"] as string) : 20

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

      res.json({
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
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get trending items",
      })
    }
  }

  /**
   * Get personalized categories for user
   */
  async getPersonalizedCategories(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(400).json({
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

      res.json({
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
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get personalized categories",
      })
    }
  }
}

// Validation rules
export const getRecommendationsValidation = [
  query("type")
    .optional()
    .isIn(["listings", "services", "agencies", "users"])
    .withMessage("Invalid recommendation type"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("diversityFactor")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Diversity factor must be between 0 and 1"),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Min rating must be between 0 and 5"),
]

export const updateBehaviorValidation = [
  body("action")
    .isIn(["view", "search", "click", "bookmark", "share", "contact", "book", "purchase"])
    .withMessage("Invalid action"),
  body("entityType")
    .isIn(["listing", "service", "agency", "user"])
    .withMessage("Invalid entity type"),
  body("entityId").isLength({ min: 1 }).withMessage("Entity ID is required"),
  body("sessionId").optional().isLength({ min: 1 }).withMessage("Session ID must not be empty"),
]

export const similarItemsValidation = [
  param("itemId").isLength({ min: 1 }).withMessage("Item ID is required"),
  query("type").optional().isIn(["listings", "services", "agencies"]).withMessage("Invalid type"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
]

export const trendingItemsValidation = [
  query("category").optional().isLength({ min: 1 }).withMessage("Category must not be empty"),
  query("location").optional().isLength({ min: 1 }).withMessage("Location must not be empty"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
]
