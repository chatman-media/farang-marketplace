import { Request, Response } from "express"
import { validationResult } from "express-validator"
import { MarketplaceIntegrationService } from "../services/MarketplaceIntegrationService"
import { AIProviderService } from "../services/AIProviderService"
import { RecommendationEngine } from "../services/RecommendationEngine"
import { UserBehaviorService } from "../services/UserBehaviorService"
import { ContentAnalysisService } from "../services/ContentAnalysisService"

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
    email?: string
  }
}

export class MarketplaceIntegrationController {
  private marketplaceService: MarketplaceIntegrationService

  constructor() {
    // Initialize services
    const aiProvider = new AIProviderService()
    const recommendationEngine = new RecommendationEngine(aiProvider)
    const userBehaviorService = new UserBehaviorService(aiProvider)
    const contentAnalysisService = new ContentAnalysisService(aiProvider)

    this.marketplaceService = new MarketplaceIntegrationService(
      aiProvider,
      recommendationEngine,
      userBehaviorService,
      contentAnalysisService,
    )
  }

  /**
   * Generate booking intelligence
   * POST /api/ai/marketplace/booking-intelligence
   */
  generateBookingIntelligence = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { userId, listingId, bookingData } = req.body
      const authenticatedUserId = req.user?.id

      // Ensure user can only access their own data or is admin
      if (authenticatedUserId !== userId && req.user?.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to user data",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const intelligence = await this.marketplaceService.generateBookingIntelligence(userId, listingId, bookingData)

      res.status(200).json({
        success: true,
        data: intelligence,
        message: "Booking intelligence generated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error generating booking intelligence:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Failed to generate booking intelligence",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Generate price suggestions
   * POST /api/ai/marketplace/price-suggestions
   */
  generatePriceSuggestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { listingId, currentPrice, marketContext } = req.body

      const suggestions = await this.marketplaceService.generatePriceSuggestions(listingId, currentPrice, marketContext)

      res.status(200).json({
        success: true,
        data: suggestions,
        message: "Price suggestions generated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error generating price suggestions:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Failed to generate price suggestions",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Create smart notification
   * POST /api/ai/marketplace/smart-notifications
   */
  createSmartNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { userId, type, context } = req.body
      const authenticatedUserId = req.user?.id

      // Ensure user can only create notifications for themselves or is admin
      if (authenticatedUserId !== userId && req.user?.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to create notifications for other users",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const notification = await this.marketplaceService.createSmartNotification(userId, type, context)

      res.status(201).json({
        success: true,
        data: notification,
        message: "Smart notification created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error creating smart notification:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Failed to create smart notification",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Detect fraud
   * POST /api/ai/marketplace/fraud-detection
   */
  detectFraud = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { userId, listingId, transactionData } = req.body
      const authenticatedUserId = req.user?.id

      // Only allow fraud detection for own data or by admin/moderator
      if (authenticatedUserId !== userId && !["admin", "moderator"].includes(req.user?.role || "")) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to fraud detection for other users",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const fraudResult = await this.marketplaceService.detectFraud(userId, listingId, transactionData)

      res.status(200).json({
        success: true,
        data: fraudResult,
        message: "Fraud detection completed successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error detecting fraud:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Failed to detect fraud",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get marketplace analytics
   * GET /api/ai/marketplace/analytics
   */
  getMarketplaceAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { timeframe = "7d", category, location } = req.query

      // Only allow admin/moderator access to analytics
      if (!["admin", "moderator"].includes(req.user?.role || "")) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to marketplace analytics",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Mock analytics data - in real implementation, this would aggregate real data
      const analytics = {
        timeframe,
        category,
        location,
        metrics: {
          totalBookings: 1250,
          averageBookingValue: 2500,
          fraudDetectionRate: 0.03,
          priceOptimizationImpact: 0.15,
          notificationEngagementRate: 0.42,
        },
        trends: {
          bookingGrowth: 0.12,
          priceStability: 0.85,
          userSatisfaction: 0.89,
          fraudReduction: 0.25,
        },
        insights: [
          {
            type: "opportunity",
            message: "Price optimization could increase revenue by 15%",
            confidence: 0.8,
          },
          {
            type: "warning",
            message: "Fraud attempts increased by 5% this week",
            confidence: 0.9,
          },
          {
            type: "success",
            message: "Smart notifications improved engagement by 42%",
            confidence: 0.95,
          },
        ],
        generatedAt: new Date().toISOString(),
      }

      res.status(200).json({
        success: true,
        data: analytics,
        message: "Marketplace analytics retrieved successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting marketplace analytics:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Failed to get marketplace analytics",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Health check for marketplace integration
   * GET /api/ai/marketplace/health
   */
  healthCheck = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const health = {
        status: "healthy",
        services: {
          aiProvider: "operational",
          recommendationEngine: "operational",
          userBehaviorService: "operational",
          contentAnalysisService: "operational",
          marketplaceIntegration: "operational",
        },
        metrics: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        },
      }

      res.status(200).json({
        success: true,
        data: health,
        message: "Marketplace integration service is healthy",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error checking health:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "Health check failed",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
