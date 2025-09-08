import { FastifyInstance } from "fastify"
import { z } from "zod"
import { FastifyAvailabilityController } from "../controllers/FastifyAvailabilityController"

// Validation schemas
const listingIdParamsSchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
})

const providerIdParamsSchema = z.object({
  providerId: z.string().uuid("Provider ID must be a valid UUID"),
})

const checkAvailabilityQuerySchema = z
  .object({
    checkIn: z.string().datetime("Check-in date must be a valid ISO 8601 date"),
    checkOut: z.string().datetime("Check-out date must be a valid ISO 8601 date").optional(),
  })
  .refine(
    (data) => {
      if (data.checkOut && data.checkIn) {
        const checkInDate = new Date(data.checkIn)
        const checkOutDate = new Date(data.checkOut)
        return checkOutDate > checkInDate
      }
      return true
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOut"],
    },
  )

const serviceAvailabilityBodySchema = z.object({
  scheduledDate: z.string().datetime("Scheduled date must be a valid ISO 8601 date"),
  duration: z.object({
    value: z.number().int().positive("Duration value must be a positive integer"),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
  }),
})

const calendarQuerySchema = z
  .object({
    startDate: z.string().datetime("Start date must be a valid ISO 8601 date"),
    endDate: z.string().datetime("End date must be a valid ISO 8601 date"),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return endDate > startDate
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )

const providerAvailabilityQuerySchema = z.object({
  date: z.string().datetime("Date must be a valid ISO 8601 date"),
})

const blockDatesBodySchema = z
  .object({
    startDate: z.string().datetime("Start date must be a valid ISO 8601 date"),
    endDate: z.string().datetime("End date must be a valid ISO 8601 date"),
    reason: z.string().min(1).max(500, "Reason must be between 1 and 500 characters"),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return endDate > startDate
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )

const unblockDatesBodySchema = z
  .object({
    startDate: z.string().datetime("Start date must be a valid ISO 8601 date"),
    endDate: z.string().datetime("End date must be a valid ISO 8601 date"),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return endDate > startDate
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )

const upcomingBookingsQuerySchema = z.object({
  limit: z.number().int().min(1).max(50, "Limit must be between 1 and 50").optional(),
})

interface RouteOptions {
  availabilityController: FastifyAvailabilityController
}

export default async function availabilityRoutes(fastify: FastifyInstance, options: RouteOptions) {
  const { availabilityController } = options

  // Check availability for a listing
  fastify.get(
    "/listings/:listingId/check",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: listingIdParamsSchema,
        querystring: checkAvailabilityQuerySchema,
      },
    },
    availabilityController.checkAvailability.bind(availabilityController),
  )

  // Check service availability
  fastify.post(
    "/providers/:providerId/check",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: providerIdParamsSchema,
        body: serviceAvailabilityBodySchema,
      },
    },
    availabilityController.checkServiceAvailability.bind(availabilityController),
  )

  // Get availability calendar
  fastify.get(
    "/listings/:listingId/calendar",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: listingIdParamsSchema,
        querystring: calendarQuerySchema,
      },
    },
    availabilityController.getAvailabilityCalendar.bind(availabilityController),
  )

  // Get service provider availability
  fastify.get(
    "/providers/:providerId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: providerIdParamsSchema,
        querystring: providerAvailabilityQuerySchema,
      },
    },
    availabilityController.getServiceProviderAvailability.bind(availabilityController),
  )

  // Block dates
  fastify.post(
    "/listings/:listingId/block",
    {
      preHandler: [fastify.authenticate, fastify.requireHostOrAdmin],
      schema: {
        params: listingIdParamsSchema,
        body: blockDatesBodySchema,
      },
    },
    availabilityController.blockDates.bind(availabilityController),
  )

  // Unblock dates
  fastify.post(
    "/listings/:listingId/unblock",
    {
      preHandler: [fastify.authenticate, fastify.requireHostOrAdmin],
      schema: {
        params: listingIdParamsSchema,
        body: unblockDatesBodySchema,
      },
    },
    availabilityController.unblockDates.bind(availabilityController),
  )

  // Get upcoming bookings
  fastify.get(
    "/listings/:listingId/upcoming",
    {
      preHandler: [fastify.authenticate, fastify.requireHostOrAdmin],
      schema: {
        params: listingIdParamsSchema,
        querystring: upcomingBookingsQuerySchema,
      },
    },
    availabilityController.getUpcomingBookings.bind(availabilityController),
  )
}
