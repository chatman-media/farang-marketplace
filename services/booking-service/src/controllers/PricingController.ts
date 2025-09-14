import logger from "@marketplace/logger"
import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import type { BookingPriceRequest, ServicePriceRequest } from "../services/PricingService"
import { PricingService } from "../services/PricingService"

// Validation schemas
export const bookingPriceBodySchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
  checkIn: z.string().datetime("Check-in date must be a valid ISO 8601 date"),
  checkOut: z.string().datetime("Check-out date must be a valid ISO 8601 date").optional(),
  guests: z.number().int().positive("Number of guests must be a positive integer"),
})

export const servicePriceBodySchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
  serviceType: z.enum(["consultation", "project", "hourly", "package", "subscription"]),
  duration: z.object({
    value: z.number().int().positive("Duration value must be a positive integer"),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
  }),
  deliveryMethod: z.enum(["online", "in_person", "hybrid"]),
})

export const dynamicPricingBodySchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
  basePrice: z.number().positive("Base price must be a positive number"),
})

export const quickEstimateQuerySchema = z.object({
  type: z.enum(["accommodation", "service"]),
  duration: z.number().int().positive("Duration must be a positive integer").optional(),
})

export const listingIdParamsSchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
})

export const pricingBreakdownQuerySchema = z.object({
  type: z.enum(["accommodation", "service"]),
})

export const comparePricingBodySchema = z.object({
  options: z
    .array(
      z.object({
        listingId: z.string().uuid("Each option must have a valid listing ID"),
        type: z.enum(["accommodation", "service"]),
      }),
    )
    .min(1)
    .max(10, "Options must be an array with 1-10 items"),
})

interface AuthenticatedRequest extends Omit<FastifyRequest, "user"> {
  user?: {
    id: string
    email: string
    role: string
    agencyId?: string
  }
}

export class PricingController {
  private pricingService: PricingService

  constructor(pricingService: PricingService) {
    this.pricingService = pricingService
  }

  // Calculate pricing for accommodation booking
  async calculateBookingPrice(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as any
      const priceRequest: BookingPriceRequest = {
        listingId: body.listingId,
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        guests: body.guests,
      }

      const pricing = await this.pricingService.calculateBookingPrice(priceRequest)

      reply.send({
        success: true,
        data: pricing,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      logger.error("Error calculating booking price:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to calculate booking price",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Calculate pricing for service booking
  async calculateServicePrice(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as any
      const priceRequest: ServicePriceRequest = {
        listingId: body.listingId,
        serviceType: body.serviceType,
        duration: body.duration,
        deliveryMethod: body.deliveryMethod,
      }

      const pricing = await this.pricingService.calculateServicePrice(priceRequest)

      reply.send({
        success: true,
        data: pricing,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      logger.error("Error calculating service price:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to calculate service price",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get quick price estimate
  async getQuickEstimate(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = request.params as any
      const query = request.query as any
      const { listingId } = params
      const { type, duration } = query

      const estimate = await this.pricingService.getQuickEstimate(listingId, type, duration)

      reply.send({
        success: true,
        data: estimate,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      logger.error("Error getting quick estimate:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to get quick estimate",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Apply dynamic pricing
  async applyDynamicPricing(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "Authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      if (request.user.role !== "host" && request.user.role !== "admin") {
        reply.code(403).send({
          error: "Forbidden",
          message: "Only hosts can apply dynamic pricing",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const body = request.body as any
      const { listingId, basePrice } = body
      const checkIn = new Date()

      const dynamicPrice = await this.pricingService.applyDynamicPricing(basePrice, listingId, checkIn)

      reply.send({
        success: true,
        data: dynamicPrice,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      logger.error("Error applying dynamic pricing:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to apply dynamic pricing",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get pricing breakdown
  async getPricingBreakdown(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const params = request.params as any
      const query = request.query as any
      const { listingId } = params
      const { type } = query

      const estimate = await this.pricingService.getQuickEstimate(listingId, type)

      reply.send({
        success: true,
        data: estimate,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      logger.error("Error getting pricing breakdown:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to get pricing breakdown",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Compare pricing between multiple options
  async comparePricing(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as any
      const { options } = body

      // Simple comparison by getting estimates for each option
      const comparisons = await Promise.all(
        options.map(async (option: any) => {
          const estimate = await this.pricingService.getQuickEstimate(option.listingId, option.type)
          return {
            listingId: option.listingId,
            type: option.type,
            ...estimate,
          }
        }),
      )

      reply.send({
        success: true,
        data: { comparisons },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      logger.error("Error comparing pricing:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to compare pricing",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
