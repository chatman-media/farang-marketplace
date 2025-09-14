import { FastifyInstance } from "fastify"

import {
  analyticsQuerySchema,
  bookingIntelligenceSchema,
  fraudDetectionSchema,
  MarketplaceIntegrationController,
  priceSuggestionsSchema,
  smartNotificationSchema,
} from "../controllers/MarketplaceIntegrationController"

interface RouteOptions {
  marketplaceController: MarketplaceIntegrationController
}

export default async function marketplaceIntegrationRoutes(fastify: FastifyInstance, options: RouteOptions) {
  const { marketplaceController } = options

  // Booking Intelligence
  fastify.post(
    "/booking-intelligence",
    {
      schema: {
        body: bookingIntelligenceSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
      // preHandler: [fastify.authenticateToken],
    },
    marketplaceController.generateBookingIntelligence.bind(marketplaceController),
  )

  // Price Suggestions
  fastify.post(
    "/price-suggestions",
    {
      schema: {
        body: priceSuggestionsSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
      // preHandler: [fastify.authenticateToken],
    },
    marketplaceController.generatePriceSuggestions.bind(marketplaceController),
  )

  // Smart Notifications
  fastify.post(
    "/smart-notifications",
    {
      schema: {
        body: smartNotificationSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
      // preHandler: [fastify.authenticateToken],
    },
    marketplaceController.createSmartNotification.bind(marketplaceController),
  )

  // Fraud Detection
  fastify.post(
    "/fraud-detection",
    {
      schema: {
        body: fraudDetectionSchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
      // preHandler: [fastify.authenticateToken],
    },
    marketplaceController.detectFraud.bind(marketplaceController),
  )

  // Analytics (Admin only)
  fastify.get(
    "/analytics",
    {
      schema: {
        querystring: analyticsQuerySchema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
      // preHandler: [fastify.authenticateToken, fastify.requireAdmin],
    },
    marketplaceController.getMarketplaceAnalytics.bind(marketplaceController),
  )

  // Health Check
  fastify.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    marketplaceController.healthCheck.bind(marketplaceController),
  )
}
