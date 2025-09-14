import type {
  BookingFilters,
  CreateBookingRequest,
  CreateServiceBookingRequest,
  UpdateStatusRequest,
} from "@marketplace/shared-types"
import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

import { BookingService } from "../services/BookingService"

// Zod schemas for validation
export const createBookingSchema = {
  body: z.object({
    listingId: z.string().uuid("Listing ID must be a valid UUID"),
    checkIn: z
      .string()
      .datetime("Check-in date must be a valid ISO 8601 date")
      .refine((date) => new Date(date) > new Date(), "Check-in date must be in the future"),
    checkOut: z.string().datetime("Check-out date must be a valid ISO 8601 date").optional(),
    adults: z.number().int().min(1).max(20, "Number of adults must be between 1 and 20").optional(),
    children: z.number().int().min(0).max(10, "Number of children must be between 0 and 10").optional(),
    infants: z.number().int().min(0).max(5, "Number of infants must be between 0 and 5").optional(),
    guests: z.number().int().min(1).max(20, "Number of guests must be between 1 and 20"),
    agencyId: z.string().uuid("Agency ID must be a valid UUID").optional(),
    specialRequests: z.string().max(1000, "Special requests must not exceed 1000 characters").optional(),
  }),
}

export const createServiceBookingSchema = {
  body: z.object({
    listingId: z.string().uuid("Listing ID must be a valid UUID"),
    serviceType: z.enum(["consultation", "project", "hourly", "package", "subscription"]),
    scheduledDate: z
      .string()
      .datetime("Scheduled date must be a valid ISO 8601 date")
      .refine((date) => new Date(date) > new Date(), "Scheduled date must be in the future"),
    scheduledTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Scheduled time must be in HH:MM format")
      .optional(),
    duration: z.object({
      value: z.number().int().positive("Duration value must be a positive integer"),
      unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
    }),
    deliveryMethod: z.enum(["online", "in_person", "hybrid"]),
    requirements: z.array(z.string()).optional(),
    deliverables: z.array(z.string()).optional(),
    communicationPreference: z.enum(["email", "phone", "chat", "video_call"]),
    timezone: z.string().min(1).max(50, "Timezone must be between 1 and 50 characters").optional(),
  }),
}

export const updateStatusSchema = {
  params: z.object({
    bookingId: z.string().uuid("Booking ID must be a valid UUID"),
  }),
  body: z.object({
    status: z.enum(["pending", "confirmed", "active", "completed", "cancelled", "disputed"]),
    reason: z.string().max(500, "Reason must not exceed 500 characters").optional(),
  }),
}

export const bookingIdSchema = {
  params: z.object({
    bookingId: z.string().uuid("Booking ID must be a valid UUID"),
  }),
}

export const searchSchema = {
  querystring: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
    status: z.enum(["pending", "confirmed", "active", "completed", "cancelled", "disputed"]).optional(),
    type: z.enum(["accommodation", "transportation", "tour", "activity", "dining", "event", "service"]).optional(),
    paymentStatus: z
      .enum(["pending", "processing", "completed", "failed", "refunded", "partially_refunded"])
      .optional(),
    guestId: z.string().uuid().optional(),
    hostId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    minPrice: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
    maxPrice: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
  }),
}

// Use FastifyRequest with user from auth middleware
type AuthenticatedRequest = FastifyRequest

export class BookingController {
  private bookingService: BookingService

  constructor() {
    this.bookingService = new BookingService()
  }

  // Create a new accommodation booking
  createBooking = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const bookingRequest: CreateBookingRequest = request.body as CreateBookingRequest
      const guestId = request.user?.id

      if (!guestId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Get host ID from listing
      const hostId = await this.getHostIdFromListing(bookingRequest.listingId)

      if (!hostId) {
        reply.code(404).send({
          error: "Not Found",
          message: "Listing not found or host not available",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const booking = await this.bookingService.createBooking(bookingRequest, guestId, hostId)

      reply.code(201).send({
        success: true,
        data: booking,
        message: "Booking created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error creating booking:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to create booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Create a new service booking
  createServiceBooking = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const serviceBookingRequest: CreateServiceBookingRequest = request.body as CreateServiceBookingRequest
      const guestId = request.user?.id

      if (!guestId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const providerId = await this.getProviderIdFromListing(serviceBookingRequest.listingId)

      if (!providerId) {
        reply.code(404).send({
          error: "Not Found",
          message: "Service listing not found or provider not available",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const serviceBooking = await this.bookingService.createServiceBooking(serviceBookingRequest, guestId, providerId)

      reply.code(201).send({
        success: true,
        data: serviceBooking,
        message: "Service booking created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error creating service booking:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to create service booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get a specific booking
  getBooking = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { bookingId } = request.params as { bookingId: string }
      const userId = request.user?.id

      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const booking = await this.bookingService.getBookingById(bookingId)

      if (!booking) {
        reply.code(404).send({
          error: "Not Found",
          message: "Booking not found or access denied",
          timestamp: new Date().toISOString(),
        })
        return
      }

      reply.send({
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error fetching booking:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get a specific service booking
  getServiceBooking = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { bookingId } = request.params as { bookingId: string }
      const userId = request.user?.id

      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const serviceBooking = await this.bookingService.getServiceBookingById(bookingId)

      if (!serviceBooking) {
        reply.code(404).send({
          error: "Not Found",
          message: "Service booking not found or access denied",
          timestamp: new Date().toISOString(),
        })
        return
      }

      reply.send({
        success: true,
        data: serviceBooking,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error fetching service booking:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch service booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Update booking status
  updateBookingStatus = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { bookingId } = request.params as { bookingId: string }
      const updateRequest: UpdateStatusRequest = request.body as UpdateStatusRequest
      const userId = request.user?.id

      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const updatedBooking = await this.bookingService.updateBookingStatus(
        bookingId,
        { status: updateRequest.status, reason: updateRequest.reason },
        userId,
      )

      if (!updatedBooking) {
        reply.code(404).send({
          error: "Not Found",
          message: "Booking not found or access denied",
          timestamp: new Date().toISOString(),
        })
        return
      }

      reply.send({
        success: true,
        data: updatedBooking,
        message: "Booking status updated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error updating booking status:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to update booking status",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Search bookings
  searchBookings = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = request.query as any
      const filters: BookingFilters = query
      const page = Number.parseInt(query.page || "1")
      const limit = Number.parseInt(query.limit || "20")
      const userId = request.user?.id

      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const result = await this.bookingService.searchBookings(filters, page, limit)

      reply.send({
        success: true,
        data: result.bookings,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
          hasMore: result.hasMore,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error searching bookings:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to search bookings",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get booking status history
  getBookingStatusHistory = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { bookingId } = request.params as { bookingId: string }
      const userId = request.user?.id

      if (!userId) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const history = await this.bookingService.getBookingStatusHistory(bookingId)

      if (!history) {
        reply.code(404).send({
          error: "Not Found",
          message: "Booking not found or access denied",
          timestamp: new Date().toISOString(),
        })
        return
      }

      reply.send({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      request.log.error("Error fetching booking status history:", error)
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch booking status history",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Helper methods
  private async getHostIdFromListing(_listingId: string): Promise<string | null> {
    // TODO: Implement actual listing service integration
    return "host-123" // Mock implementation
  }

  private async getProviderIdFromListing(_listingId: string): Promise<string | null> {
    // TODO: Implement actual listing service integration
    return "provider-123" // Mock implementation
  }
}
