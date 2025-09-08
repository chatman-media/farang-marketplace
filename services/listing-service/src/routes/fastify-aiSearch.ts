import { FastifyInstance, FastifyPluginOptions } from "fastify"
import { FastifyAISearchController } from "../controllers/FastifyAISearchController"
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth"

// Rate limiting configurations
const enhancedSearchRateLimit = {
  max: 30,
  timeWindow: "1 minute",
}

const queryAnalysisRateLimit = {
  max: 50,
  timeWindow: "1 minute",
}

const suggestionsRateLimit = {
  max: 100,
  timeWindow: "1 minute",
}

const recommendationsRateLimit = {
  max: 20,
  timeWindow: "1 minute",
}

const serviceMatchingRateLimit = {
  max: 10,
  timeWindow: "1 minute",
}

interface AISearchRouteOptions extends FastifyPluginOptions {
  prefix?: string
}

export default async function aiSearchRoutes(fastify: FastifyInstance, _options: AISearchRouteOptions) {
  const controller = new FastifyAISearchController()

  // Enhanced Search - POST /search/enhanced
  fastify.post(
    "/search/enhanced",
    {
      preHandler: [optionalAuthMiddleware],
      schema: {
        body: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", minLength: 1, maxLength: 500 },
            filters: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["vehicle", "product", "service"] },
                category: { type: "string", maxLength: 100 },
                priceRange: {
                  type: "object",
                  properties: {
                    min: { type: "number", minimum: 0 },
                    max: { type: "number", minimum: 0 },
                  },
                  required: ["min", "max"],
                },
                location: { type: "string", maxLength: 200 },
                availability: { type: "boolean" },
              },
            },
            userContext: {
              type: "object",
              properties: {
                userId: { type: "string", format: "uuid" },
                location: {
                  type: "object",
                  properties: {
                    latitude: { type: "number", minimum: -90, maximum: 90 },
                    longitude: { type: "number", minimum: -180, maximum: 180 },
                  },
                  required: ["latitude", "longitude"],
                },
              },
            },
            preferredProvider: { type: "string", enum: ["openai", "deepseek", "claude"] },
          },
        },
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
      config: {
        rateLimit: enhancedSearchRateLimit,
      },
    },
    controller.enhancedSearch,
  )

  // Query Analysis - POST /query/analyze
  fastify.post(
    "/query/analyze",
    {
      preHandler: [optionalAuthMiddleware],
      schema: {
        body: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", minLength: 1, maxLength: 500 },
            preferredProvider: { type: "string", enum: ["openai", "deepseek", "claude"] },
          },
        },
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
      config: {
        rateLimit: queryAnalysisRateLimit,
      },
    },
    controller.analyzeQuery,
  )

  // Get Suggestions - GET /suggestions
  fastify.get(
    "/suggestions",
    {
      preHandler: [optionalAuthMiddleware],
      schema: {
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: { type: "string", minLength: 1, maxLength: 100 },
            provider: { type: "string", enum: ["openai", "deepseek", "claude"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
            },
          },
        },
      },
      config: {
        rateLimit: suggestionsRateLimit,
      },
    },
    controller.getSuggestions,
  )

  // Get Recommendations - POST /recommendations
  fastify.post(
    "/recommendations",
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: "object",
          required: ["userId", "type"],
          properties: {
            userId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["similar", "personalized", "trending", "location-based"] },
            context: { type: "object" },
            limit: { type: "number", minimum: 1, maximum: 50 },
            preferredProvider: { type: "string", enum: ["openai", "deepseek", "claude"] },
          },
        },
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
      config: {
        rateLimit: recommendationsRateLimit,
      },
    },
    controller.getRecommendations,
  )

  // Service Matching - POST /services/match
  fastify.post(
    "/services/match",
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: "object",
          required: ["requirements"],
          properties: {
            requirements: {
              type: "object",
              required: ["serviceType", "location"],
              properties: {
                serviceType: { type: "string", minLength: 1 },
                location: {
                  type: "object",
                  required: ["latitude", "longitude"],
                  properties: {
                    latitude: { type: "number", minimum: -90, maximum: 90 },
                    longitude: { type: "number", minimum: -180, maximum: 180 },
                    radius: { type: "number" },
                  },
                },
                budget: {
                  type: "object",
                  required: ["min", "max"],
                  properties: {
                    min: { type: "number" },
                    max: { type: "number" },
                  },
                },
                timeframe: {
                  type: "object",
                  required: ["start", "end"],
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" },
                  },
                },
                preferences: {
                  type: "array",
                  items: { type: "string" },
                },
                specialRequirements: { type: "string" },
              },
            },
            userProfile: { type: "object" },
            preferredProvider: { type: "string", enum: ["openai", "deepseek", "claude"] },
          },
        },
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
      config: {
        rateLimit: serviceMatchingRateLimit,
      },
    },
    controller.matchServices,
  )

  // AI Status - GET /status
  fastify.get(
    "/status",
    {
      preHandler: [optionalAuthMiddleware],
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
    controller.getAIStatus,
  )

  // Cost Estimate - GET /cost-estimate
  fastify.get(
    "/cost-estimate",
    {
      preHandler: [optionalAuthMiddleware],
      schema: {
        querystring: {
          type: "object",
          properties: {
            operation: { type: "string", default: "search" },
            dataSize: { type: "number", default: 1000 },
          },
        },
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
    controller.getCostEstimate,
  )
}
