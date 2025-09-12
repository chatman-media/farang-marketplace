import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import { AvailabilityService } from "../services/AvailabilityService"
// Types are extended in fastify module declaration

// Validation schemas
export const listingIdParamsSchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
})

export const providerIdParamsSchema = z.object({
  providerId: z.string().uuid("Provider ID must be a valid UUID"),
})

export const checkAvailabilityQuerySchema = z.object({
  checkIn: z.string().datetime("Check-in date must be a valid ISO 8601 date"),
  checkOut: z.string().datetime("Check-out date must be a valid ISO 8601 date").optional(),
})

export const serviceAvailabilityBodySchema = z.object({
  scheduledDate: z.string().datetime("Scheduled date must be a valid ISO 8601 date"),
  duration: z.object({
    value: z.number().int().positive("Duration value must be a positive integer"),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
  }),
})

export const calendarQuerySchema = z.object({
  startDate: z.string().datetime("Start date must be a valid ISO 8601 date"),
  endDate: z.string().datetime("End date must be a valid ISO 8601 date"),
})

export const providerAvailabilityQuerySchema = z.object({
  date: z.string().datetime("Date must be a valid ISO 8601 date"),
})

export const blockDatesBodySchema = z.object({
  startDate: z.string().datetime("Start date must be a valid ISO 8601 date"),
  endDate: z.string().datetime("End date must be a valid ISO 8601 date"),
  reason: z.string().min(1).max(500, "Reason must be between 1 and 500 characters"),
})

export const unblockDatesBodySchema = z.object({
  startDate: z.string().datetime("Start date must be a valid ISO 8601 date"),
  endDate: z.string().datetime("End date must be a valid ISO 8601 date"),
})

export const upcomingBookingsQuerySchema = z.object({
  limit: z.number().int().min(1).max(50, "Limit must be between 1 and 50").optional(),
})

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    role: "guest" | "host" | "admin"
    verified: boolean
  }
}

export class AvailabilityController {
  private availabilityService: AvailabilityService

  constructor(availabilityService: AvailabilityService) {
    this.availabilityService = availabilityService
  }

  // Check availability for a listing
  async checkAvailability(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { listingId } = request.params as z.infer<typeof listingIdParamsSchema>
      const { checkIn, checkOut } = request.query as z.infer<typeof checkAvailabilityQuerySchema>

      const checkInDate = new Date(checkIn)
      const checkOutDate = checkOut ? new Date(checkOut) : undefined

      const isAvailable = await this.availabilityService.checkAvailability(listingId, checkInDate, checkOutDate)

      reply.send({
        success: true,
        data: {
          listingId,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate?.toISOString(),
          available: isAvailable,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error checking availability:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to check availability",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Check service availability
  async checkServiceAvailability(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { providerId } = request.params as z.infer<typeof providerIdParamsSchema>
      const { scheduledDate, duration } = request.body as z.infer<typeof serviceAvailabilityBodySchema>

      const scheduledDateTime = new Date(scheduledDate)

      const isAvailable = await this.availabilityService.checkServiceAvailability(
        providerId,
        scheduledDateTime,
        duration,
      )

      reply.send({
        success: true,
        data: {
          providerId,
          scheduledDate: scheduledDateTime.toISOString(),
          duration,
          available: isAvailable,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error checking service availability:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to check service availability",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get availability calendar
  async getAvailabilityCalendar(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { listingId } = request.params as z.infer<typeof listingIdParamsSchema>
      const { startDate, endDate } = request.query as z.infer<typeof calendarQuerySchema>

      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)

      const calendar = await this.availabilityService.getAvailabilityCalendar(listingId, startDateTime, endDateTime)

      reply.send({
        success: true,
        data: {
          listingId,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          calendar,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting availability calendar:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to get availability calendar",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get service provider availability
  async getServiceProviderAvailability(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { providerId } = request.params as z.infer<typeof providerIdParamsSchema>
      const { date } = request.query as z.infer<typeof providerAvailabilityQuerySchema>

      const queryDate = new Date(date)

      const availability = await this.availabilityService.getServiceProviderAvailability(providerId, queryDate)

      reply.send({
        success: true,
        data: {
          providerId,
          date: queryDate.toISOString(),
          availability,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting service provider availability:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to get service provider availability",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Block dates
  async blockDates(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { listingId } = request.params as z.infer<typeof listingIdParamsSchema>
      const { startDate, endDate, reason } = request.body as z.infer<typeof blockDatesBodySchema>

      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)

      const userId = request.user?.id
      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User ID is required",
        })
        return
      }

      await this.availabilityService.blockDates(listingId, startDateTime, endDateTime, reason, userId)

      reply.send({
        success: true,
        message: "Dates blocked successfully",
        data: {
          listingId,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          reason,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error blocking dates:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to block dates",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Unblock dates
  async unblockDates(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { listingId } = request.params as z.infer<typeof listingIdParamsSchema>
      const { startDate, endDate } = request.body as z.infer<typeof unblockDatesBodySchema>

      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)

      const userId = request.user?.id
      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User ID is required",
        })
        return
      }

      await this.availabilityService.unblockDates(listingId, startDateTime, endDateTime)

      reply.send({
        success: true,
        message: "Dates unblocked successfully",
        data: {
          listingId,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error unblocking dates:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to unblock dates",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get upcoming bookings
  async getUpcomingBookings(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { listingId } = request.params as z.infer<typeof listingIdParamsSchema>
      const { limit } = request.query as z.infer<typeof upcomingBookingsQuerySchema>

      const userId = request.user?.id
      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User ID is required",
        })
        return
      }

      const bookings = await this.availabilityService.getUpcomingBookings(listingId, limit)

      reply.send({
        success: true,
        data: {
          listingId,
          bookings,
          count: bookings.length,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting upcoming bookings:", error)

      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to get upcoming bookings",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
