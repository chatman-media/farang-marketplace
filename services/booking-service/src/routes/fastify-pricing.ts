import { FastifyInstance } from "fastify"
import { z } from "zod"
import { PricingController } from "../controllers/PricingController"

// Validation schemas
const bookingPriceBodySchema = z
  .object({
    listingId: z.string().uuid("Listing ID must be a valid UUID"),
    checkIn: z.string().datetime("Check-in date must be a valid ISO 8601 date"),
    checkOut: z.string().datetime("Check-out date must be a valid ISO 8601 date").optional(),
    guests: z.number().int().min(1).max(20, "Number of guests must be between 1 and 20"),
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

const servicePriceBodySchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
  serviceType: z.enum(["consultation", "project", "hourly", "package", "subscription"]),
  duration: z.object({
    value: z.number().int().positive("Duration value must be a positive integer"),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
  }),
  deliveryMethod: z.enum(["online", "in_person", "hybrid"]),
})

const listingIdParamsSchema = z.object({
  listingId: z.string().uuid("Listing ID must be a valid UUID"),
})

const quickEstimateQuerySchema = z.object({
  type: z.enum(["accommodation", "service"]),
  duration: z.number().int().positive("Duration must be a positive integer").optional(),
})

const dynamicPricingBodySchema = z.object({
  basePrice: z.number().min(0, "Base price must be a non-negative number"),
  checkIn: z.string().datetime("Check-in date must be a valid ISO 8601 date"),
  checkOut: z.string().datetime("Check-out date must be a valid ISO 8601 date").optional(),
})

const pricingBreakdownQuerySchema = z.object({
  type: z.enum(["accommodation", "service"]),
})

const pricingBreakdownBodySchema = z.union([
  z.object({
    listingId: z.string().uuid(),
    checkIn: z.string().datetime(),
    checkOut: z.string().datetime().optional(),
    guests: z.number().int().min(1),
  }),
  z.object({
    listingId: z.string().uuid(),
    serviceType: z.enum(["consultation", "project", "hourly", "package", "subscription"]),
    duration: z.object({
      value: z.number().int().positive(),
      unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
    }),
    deliveryMethod: z.enum(["online", "in_person", "hybrid"]),
  }),
])

const comparePricingBodySchema = z.object({
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

interface RouteOptions {
  pricingController: PricingController
}

export default async function pricingRoutes(fastify: FastifyInstance, options: RouteOptions) {
  const { pricingController } = options

  // Calculate booking price
  fastify.post(
    "/booking",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: bookingPriceBodySchema,
      },
    },
    pricingController.calculateBookingPrice.bind(pricingController),
  )

  // Calculate service price
  fastify.post(
    "/service",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: servicePriceBodySchema,
      },
    },
    pricingController.calculateServicePrice.bind(pricingController),
  )

  // Get quick estimate
  fastify.get(
    "/estimate/:listingId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: listingIdParamsSchema,
        querystring: quickEstimateQuerySchema,
      },
    },
    pricingController.getQuickEstimate.bind(pricingController),
  )

  // Apply dynamic pricing
  fastify.post(
    "/dynamic/:listingId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: listingIdParamsSchema,
        body: dynamicPricingBodySchema,
      },
    },
    pricingController.applyDynamicPricing.bind(pricingController),
  )

  // Get pricing breakdown
  fastify.post(
    "/breakdown",
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: pricingBreakdownQuerySchema,
        body: pricingBreakdownBodySchema,
      },
    },
    pricingController.getPricingBreakdown.bind(pricingController),
  )

  // Compare pricing
  fastify.post(
    "/compare",
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: comparePricingBodySchema,
      },
    },
    pricingController.comparePricing.bind(pricingController),
  )
}
