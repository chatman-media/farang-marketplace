import { FastifyInstance } from "fastify"

import { PricingController } from "../controllers/PricingController"

interface RouteOptions {
  pricingController: PricingController
}

export default async function pricingRoutes(fastify: FastifyInstance, options: RouteOptions) {
  const { pricingController } = options

  // Calculate booking price
  fastify.post(
    "/booking",
    {
      // preHandler: [fastify.authenticate],
    },
    pricingController.calculateBookingPrice.bind(pricingController),
  )

  // Calculate service price
  fastify.post(
    "/service",
    {
      // preHandler: [fastify.authenticate],
    },
    pricingController.calculateServicePrice.bind(pricingController),
  )

  // Get quick estimate
  fastify.get(
    "/estimate/:listingId",
    {
      // preHandler: [fastify.authenticate],
    },
    pricingController.getQuickEstimate.bind(pricingController),
  )

  // Apply dynamic pricing
  fastify.post(
    "/dynamic/:listingId",
    {
      // preHandler: [fastify.authenticate],
    },
    pricingController.applyDynamicPricing.bind(pricingController),
  )

  // Get pricing breakdown
  fastify.post(
    "/breakdown",
    {
      // preHandler: [fastify.authenticate],
    },
    pricingController.getPricingBreakdown.bind(pricingController),
  )

  // Compare pricing
  fastify.post(
    "/compare",
    {
      // preHandler: [fastify.authenticate],
    },
    pricingController.comparePricing.bind(pricingController),
  )
}
