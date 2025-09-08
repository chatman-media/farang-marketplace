import { FastifyPluginAsync } from "fastify"
import { BookingController } from "../controllers/BookingController"

interface BookingRouteOptions {
  bookingController: BookingController
}

const bookingRoutes: FastifyPluginAsync<BookingRouteOptions> = async (fastify, options) => {
  const { bookingController } = options

  // Create accommodation booking
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: bookingController.createBooking.bind(bookingController),
  })

  // Create service booking
  fastify.post("/service", {
    preHandler: [fastify.authenticate],
    handler: bookingController.createServiceBooking.bind(bookingController),
  })

  // Search bookings
  fastify.get("/search", {
    preHandler: [fastify.authenticate],
    handler: bookingController.searchBookings.bind(bookingController),
  })

  // Get specific booking
  fastify.get("/:bookingId", {
    preHandler: [fastify.authenticate],
    handler: bookingController.getBooking.bind(bookingController),
  })

  // Get specific service booking
  fastify.get("/:bookingId/service", {
    preHandler: [fastify.authenticate],
    handler: bookingController.getServiceBooking.bind(bookingController),
  })

  // Update booking status
  fastify.patch("/:bookingId/status", {
    preHandler: [fastify.authenticate],
    handler: bookingController.updateBookingStatus.bind(bookingController),
  })

  // Get booking status history
  fastify.get("/:bookingId/history", {
    preHandler: [fastify.authenticate],
    handler: bookingController.getBookingStatusHistory.bind(bookingController),
  })
}

export default bookingRoutes
