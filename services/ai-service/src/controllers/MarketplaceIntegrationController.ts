import logger from "@marketplace/logger"
import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import type { AuthenticatedUser } from "../middleware/auth"
import { AIProviderService } from "../services/AIProviderService"
import { ContentAnalysisService } from "../services/ContentAnalysisService"
import { MarketplaceIntegrationService } from "../services/MarketplaceIntegrationService"
import { RecommendationEngine } from "../services/RecommendationEngine"
import { UserBehaviorService } from "../services/UserBehaviorService"

// Zod schemas for validation
export const bookingIntelligenceSchema = z.object({
  listingId: z.string().min(1),
  userId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1),
  budget: z.number().min(0).optional(),
  preferences: z.array(z.string()).optional(),
  context: z.record(z.string(), z.any()).optional(),
})

export const priceSuggestionsSchema = z.object({
  listingId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1),
  marketData: z
    .object({
      competitors: z
        .array(
          z.object({
            id: z.string(),
            price: z.number(),
            rating: z.number().optional(),
          }),
        )
        .optional(),
      seasonality: z.string().optional(),
      events: z.array(z.string()).optional(),
    })
    .optional(),
})

export const smartNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["booking_reminder", "price_alert", "recommendation", "engagement"]),
  data: z.record(z.string(), z.any()),
  preferences: z
    .object({
      channels: z.array(z.enum(["email", "push", "sms"])),
      timing: z.string().optional(),
      frequency: z.enum(["immediate", "daily", "weekly"]).optional(),
    })
    .optional(),
})

export const fraudDetectionSchema = z.object({
  transactionId: z.string().min(1),
  userId: z.string().min(1),
  listingId: z.string().min(1),
  amount: z.number().min(0),
  paymentMethod: z.string(),
  userBehavior: z.object({
    ipAddress: z.string(),
    userAgent: z.string(),
    sessionDuration: z.number().optional(),
    previousBookings: z.number().optional(),
  }),
  bookingDetails: z.object({
    checkIn: z.string().datetime(),
    checkOut: z.string().datetime(),
    guests: z.number().int().min(1),
    bookingTime: z.string().datetime(),
  }),
})

export const analyticsQuerySchema = z.object({
  timeframe: z.enum(["1d", "7d", "30d", "90d"]).optional(),
  metrics: z.array(z.enum(["bookings", "revenue", "conversion", "user_engagement"])).optional(),
  filters: z
    .object({
      category: z.string().optional(),
      location: z.string().optional(),
      priceRange: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
})

interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser
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
   */
  async generateBookingIntelligence(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = bookingIntelligenceSchema.parse(request.body)

      const intelligence = await this.marketplaceService.generateBookingIntelligence(body.userId, body.listingId, {
        checkIn: new Date(body.checkIn),
        checkOut: new Date(body.checkOut),
        guests: body.guests,
        budget: body.budget,
        preferences: body.preferences || [],
        context: body.context || {},
      })

      reply.send({
        success: true,
        data: intelligence,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Validation Error",
          details: error.issues,
          timestamp: new Date().toISOString(),
        })
      }

      logger.error("Error generating booking intelligence:", error)
      reply.code(500).send({
        success: false,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Failed to generate booking intelligence",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Generate price suggestions
   */
  async generatePriceSuggestions(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const validatedData = priceSuggestionsSchema.parse(request.body)

      const suggestions = await this.marketplaceService.generatePriceSuggestions(
        validatedData.listingId,
        undefined, // currentPrice
        {
          checkIn: validatedData.checkIn,
          checkOut: validatedData.checkOut,
          guests: validatedData.guests,
          ...validatedData.marketData,
        },
      )

      reply.send({
        success: true,
        data: suggestions,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          success: false,
          error: "Validation failed",
          details: error.issues,
        })
      } else {
        reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate price suggestions",
        })
      }
    }
  }

  /**
   * Create smart notification
   */
  async createSmartNotification(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const validatedData = smartNotificationSchema.parse(request.body)

      const notification = await this.marketplaceService.createSmartNotification(
        validatedData.userId,
        validatedData.type,
        validatedData.data,
      )

      reply.send({
        success: true,
        data: notification,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          success: false,
          error: "Validation failed",
          details: error.issues,
        })
      } else {
        reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : "Failed to create smart notification",
        })
      }
    }
  }

  /**
   * Detect fraud
   */
  async detectFraud(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = fraudDetectionSchema.parse(request.body)

      const fraudAnalysis = await this.marketplaceService.detectFraud(body.userId, body.listingId, {
        transactionId: body.transactionId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        userBehavior: body.userBehavior,
        bookingDetails: {
          checkIn: new Date(body.bookingDetails.checkIn),
          checkOut: new Date(body.bookingDetails.checkOut),
          guests: body.bookingDetails.guests,
          bookingTime: new Date(body.bookingDetails.bookingTime),
        },
      })

      reply.send({
        success: true,
        data: fraudAnalysis,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Validation Error",
          details: error.issues,
          timestamp: new Date().toISOString(),
        })
      }

      logger.error("Error detecting fraud:", error)
      reply.code(500).send({
        success: false,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Failed to detect fraud",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get marketplace analytics
   */
  async getMarketplaceAnalytics(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      // Simplified analytics response since the service doesn't have this method
      reply.send({
        success: true,
        data: {
          message: "Analytics endpoint not yet implemented",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get analytics",
      })
    }
  }

  /**
   * Health check
   */
  async healthCheck(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      reply.send({
        success: true,
        data: {
          status: "healthy",
          service: "marketplace-integration",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
      })
    }
  }
}
