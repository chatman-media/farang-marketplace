import { FastifyInstance } from "fastify"

import {
  getListingInsightsParamsSchema,
  getListingInsightsQuerySchema,
  getMarketInsightsQuerySchema,
  getUserInsightsParamsSchema,
  getUserInsightsQuerySchema,
  InsightsController,
  trackBehaviorSchema,
} from "../controllers/InsightsController"

interface RouteOptions {
  insightsController: InsightsController
}

export default async function insightsRoutes(fastify: FastifyInstance, options: RouteOptions) {
  const { insightsController } = options

  // Track user behavior
  fastify.post(
    "/behavior",
    {
      schema: {
        body: trackBehaviorSchema,
      },
      // preHandler: [fastify.authenticate],
    },
    insightsController.trackBehavior.bind(insightsController),
  )

  // User insights routes
  fastify.get(
    "/users/:userId",
    {
      schema: {
        params: getUserInsightsParamsSchema,
        querystring: getUserInsightsQuerySchema,
      },
      // preHandler: [fastify.authenticate],
    },
    insightsController.getUserInsights.bind(insightsController),
  )

  // Listing insights
  fastify.get(
    "/listings/:listingId",
    {
      schema: {
        params: getListingInsightsParamsSchema,
        querystring: getListingInsightsQuerySchema,
      },
      // preHandler: [fastify.authenticate],
    },
    insightsController.getListingInsights.bind(insightsController),
  )

  // Market insights
  fastify.get(
    "/market",
    {
      schema: {
        querystring: getMarketInsightsQuerySchema,
      },
      // preHandler: [fastify.authenticate],
    },
    insightsController.getMarketInsights.bind(insightsController),
  )

  // Analytics dashboard (admin only)
  fastify.get(
    "/dashboard",
    {
      // preHandler: [fastify.authenticate],
    },
    insightsController.getAnalyticsDashboard.bind(insightsController),
  )

  // User behavior patterns
  fastify.get(
    "/users/:userId/patterns",
    {
      schema: {
        params: getUserInsightsParamsSchema,
      },
      // preHandler: [fastify.authenticate],
    },
    insightsController.getUserBehaviorPatterns.bind(insightsController),
  )

  // Health check for insights service
  fastify.get("/health", async () => {
    return {
      status: "healthy",
      service: "insights",
      timestamp: new Date().toISOString(),
    }
  })
}
