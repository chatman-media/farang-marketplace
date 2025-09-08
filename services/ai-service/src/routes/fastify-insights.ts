import { FastifyInstance } from "fastify"
import { InsightsController } from "../controllers/InsightsController"
import {
  trackBehaviorSchema,
  userInsightsParamsSchema,
  userInsightsQuerySchema,
  marketInsightsQuerySchema,
  behaviorTrendsQuerySchema,
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
      preHandler: [fastify.optionalAuth],
    },
    insightsController.trackBehavior.bind(insightsController),
  )

  // User insights routes
  fastify.get(
    "/user/:userId?",
    {
      schema: {
        params: userInsightsParamsSchema,
        querystring: userInsightsQuerySchema,
      },
      preHandler: [fastify.authenticateToken],
    },
    insightsController.getUserInsights.bind(insightsController),
  )

  fastify.post(
    "/user/:userId?/analyze",
    {
      schema: {
        params: userInsightsParamsSchema,
      },
      preHandler: [fastify.authenticateToken],
    },
    insightsController.analyzeUserBehavior.bind(insightsController),
  )

  // Behavior statistics (admin only)
  fastify.get(
    "/behavior/stats",
    {
      preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    insightsController.getBehaviorStats.bind(insightsController),
  )

  // Market insights routes (admin only)
  fastify.get(
    "/market",
    {
      schema: {
        querystring: marketInsightsQuerySchema,
      },
      preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    insightsController.getMarketInsights.bind(insightsController),
  )

  fastify.post(
    "/market/generate",
    {
      preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    insightsController.generateMarketInsights.bind(insightsController),
  )

  // User segments (admin only)
  fastify.get(
    "/segments",
    {
      preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    insightsController.getUserSegments.bind(insightsController),
  )

  // Behavior trends (admin only)
  fastify.get(
    "/trends",
    {
      schema: {
        querystring: behaviorTrendsQuerySchema,
      },
      preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    insightsController.getBehaviorTrends.bind(insightsController),
  )
}
