import { FastifyInstance } from "fastify"
import { AvailabilityController } from "../controllers/AvailabilityController"
import { BookingController } from "../controllers/BookingController"
import { PricingController } from "../controllers/PricingController"
import { AvailabilityService } from "../services/AvailabilityService"
import { PricingService } from "../services/PricingService"

export async function registerBookingRoutes(app: FastifyInstance): Promise<void> {
  // Initialize services
  const availabilityService = new AvailabilityService()
  const pricingService = new PricingService()

  // Initialize controllers
  const bookingController = new BookingController()
  const availabilityController = new AvailabilityController(availabilityService)
  const pricingController = new PricingController(pricingService)

  // Register routes
  await app.register(import("./bookings"), { prefix: "/api/bookings", bookingController })
  await app.register(import("./availability"), {
    prefix: "/api/availability",
    availabilityController,
  })
  await app.register(import("./pricing"), { prefix: "/api/pricing", pricingController })
}
