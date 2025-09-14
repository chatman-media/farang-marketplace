import { FastifyPluginAsync } from "fastify"

import { RecommendationController } from "../controllers/RecommendationController"

const recommendationRoutes: FastifyPluginAsync<{
  recommendationController: RecommendationController
}> = async (fastify, opts) => {
  const { recommendationController } = opts

  // Public routes with optional authentication
  fastify.get(
    "/trending",
    {
      // preHandler: [fastify.optionalAuth],
      schema: {
        querystring: {
          type: "object",
          properties: {
            category: { type: "string" },
            limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
            timeframe: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
          },
        },
      },
    },
    recommendationController.getTrendingItems.bind(recommendationController),
  )

  fastify.get(
    "/similar/:itemId",
    {
      // preHandler: [fastify.optionalAuth],
      schema: {
        params: {
          type: "object",
          properties: {
            itemId: { type: "string", format: "uuid" },
          },
          required: ["itemId"],
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", minimum: 1, maximum: 20, default: 5 },
          },
        },
      },
    },
    recommendationController.getSimilarItems.bind(recommendationController),
  )

  // Protected routes - require authentication
  fastify.get(
    "/",
    {
      // preHandler: [fastify.authenticateToken, fastify.roleBasedRateLimit],
      schema: {
        querystring: {
          type: "object",
          properties: {
            category: { type: "string" },
            limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
            includeViewed: { type: "boolean", default: false },
          },
        },
      },
    },
    recommendationController.getRecommendations.bind(recommendationController),
  )

  fastify.get(
    "/categories",
    {
      // preHandler: [fastify.authenticateToken, fastify.roleBasedRateLimit],
    },
    recommendationController.getPersonalizedCategories.bind(recommendationController),
  )

  // Behavior tracking
  fastify.post(
    "/behavior",
    {
      // preHandler: [fastify.authenticateToken, fastify.roleBasedRateLimit],
      schema: {
        body: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["view", "like", "share", "purchase", "search"] },
            itemId: { type: "string", format: "uuid" },
            category: { type: "string" },
            metadata: { type: "object" },
          },
          required: ["action", "itemId"],
        },
      },
    },
    recommendationController.updateUserBehavior.bind(recommendationController),
  )

  // Admin only routes
  fastify.get(
    "/stats",
    {
      // preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    recommendationController.getRecommendationStats.bind(recommendationController),
  )
}

export default recommendationRoutes
