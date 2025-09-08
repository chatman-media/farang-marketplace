import { FastifyInstance } from "fastify"
import { AvailabilityController } from "../controllers/AvailabilityController"

interface RouteOptions {
  availabilityController: AvailabilityController
}

export default async function availabilityRoutes(fastify: FastifyInstance, options: RouteOptions) {
  const { availabilityController } = options

  // Check availability for a listing
  fastify.get(
    "/listings/:listingId/check",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.checkAvailability.bind(availabilityController),
  )

  // Check service availability
  fastify.post(
    "/providers/:providerId/check",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.checkServiceAvailability.bind(availabilityController),
  )

  // Get availability calendar
  fastify.get(
    "/listings/:listingId/calendar",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.getAvailabilityCalendar.bind(availabilityController),
  )

  // Get service provider availability
  fastify.get(
    "/providers/:providerId",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.getServiceProviderAvailability.bind(availabilityController),
  )

  // Block dates
  fastify.post(
    "/listings/:listingId/block",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.blockDates.bind(availabilityController),
  )

  // Unblock dates
  fastify.post(
    "/listings/:listingId/unblock",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.unblockDates.bind(availabilityController),
  )

  // Get upcoming bookings
  fastify.get(
    "/listings/:listingId/upcoming",
    {
      // preHandler: [fastify.authenticate],
    },
    availabilityController.getUpcomingBookings.bind(availabilityController),
  )
}
