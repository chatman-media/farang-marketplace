import { FastifyPluginAsync } from "fastify"
import {
  BookingController,
  createBookingSchema,
  createServiceBookingSchema,
  updateStatusSchema,
  bookingIdSchema,
  searchSchema,
} from "../controllers/BookingController"

interface BookingRouteOptions {
  bookingController: BookingController
}

const bookingRoutes: FastifyPluginAsync<BookingRouteOptions> = async (fastify, options) => {
  const { bookingController } = options

  // All routes require authentication
  fastify.addHook("preHandler", fastify.authenticate)

  // Create accommodation booking
  fastify.post("/", {
    schema: createBookingSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.createBooking.bind(bookingController),
  })

  // Create service booking
  fastify.post("/service", {
    schema: createServiceBookingSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.createServiceBooking.bind(bookingController),
  })

  // Search bookings
  fastify.get("/search", {
    schema: searchSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.searchBookings.bind(bookingController),
  })

  // Get specific booking
  fastify.get("/:bookingId", {
    schema: bookingIdSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.getBooking.bind(bookingController),
  })

  // Get specific service booking
  fastify.get("/:bookingId/service", {
    schema: bookingIdSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.getServiceBooking.bind(bookingController),
  })

  // Update booking status
  fastify.patch("/:bookingId/status", {
    schema: updateStatusSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.updateBookingStatus.bind(bookingController),
  })

  // Get booking status history
  fastify.get("/:bookingId/history", {
    schema: bookingIdSchema,
    preHandler: [fastify.authenticate],
    handler: bookingController.getBookingStatusHistory.bind(bookingController),
  })
}

export default bookingRoutes
