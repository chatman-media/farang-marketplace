import { FastifyInstance, FastifyPluginAsync } from "fastify"

import { AIIntegrationController } from "../controllers/AIIntegrationController"

const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const aiController = new AIIntegrationController()

  // Enhanced search endpoint
  fastify.post(
    "/search/enhanced",
    {
      schema: {
        description: "AI-enhanced search with query understanding and result ranking",
        tags: ["AI", "Search"],
        body: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "Search query",
              minLength: 1,
            },
            filters: {
              type: "object",
              description: "Search filters",
              additionalProperties: true,
            },
            userContext: {
              type: "object",
              properties: {
                userId: { type: "string" },
                location: {
                  type: "object",
                  properties: {
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                  },
                },
                previousSearches: {
                  type: "array",
                  items: { type: "string" },
                },
                preferences: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            },
            preferredProvider: {
              type: "string",
              enum: ["openai", "deepseek", "claude"],
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  enhancedQuery: { type: "string" },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                  },
                  filters: { type: "object" },
                  aiInsights: {
                    type: "object",
                    properties: {
                      queryUnderstanding: { type: "string" },
                      searchStrategy: { type: "string" },
                      recommendations: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                  processingTime: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    aiController.enhancedSearch,
  )

  // Query analysis endpoint
  fastify.post(
    "/query/analyze",
    {
      schema: {
        description: "Analyze search query intent and extract entities",
        tags: ["AI", "Analysis"],
        body: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "Query to analyze",
              minLength: 1,
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  intent: { type: "string" },
                  entities: { type: "object" },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                  },
                  confidence: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    aiController.analyzeQuery,
  )

  // Recommendations endpoint
  fastify.post(
    "/recommendations",
    {
      schema: {
        description: "Get AI-powered recommendations",
        tags: ["AI", "Recommendations"],
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
            listingId: { type: "string" },
            category: { type: "string" },
            userBehavior: { type: "object" },
            context: { type: "object" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        listingId: { type: "string" },
                        score: { type: "number" },
                        reason: { type: "string" },
                        type: { type: "string" },
                      },
                    },
                  },
                  metadata: {
                    type: "object",
                    properties: {
                      algorithm: { type: "string" },
                      confidence: { type: "number" },
                      factors: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    aiController.getRecommendations,
  )

  // Price suggestions endpoint
  fastify.post(
    "/price-suggestions",
    {
      schema: {
        description: "Get AI-powered price suggestions",
        tags: ["AI", "Pricing"],
        body: {
          type: "object",
          required: ["listingId", "category", "location", "features"],
          properties: {
            listingId: { type: "string" },
            category: { type: "string" },
            location: {
              type: "object",
              required: ["city", "region", "country"],
              properties: {
                city: { type: "string" },
                region: { type: "string" },
                country: { type: "string" },
              },
            },
            features: { type: "object" },
            currentPrice: { type: "number" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  suggestedPrice: { type: "number" },
                  priceRange: {
                    type: "object",
                    properties: {
                      min: { type: "number" },
                      max: { type: "number" },
                    },
                  },
                  confidence: { type: "number" },
                  factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        impact: { type: "number" },
                        description: { type: "string" },
                      },
                    },
                  },
                  marketData: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    aiController.getPriceSuggestions,
  )

  // Search suggestions endpoint
  fastify.get(
    "/suggestions",
    {
      schema: {
        description: "Generate search suggestions",
        tags: ["AI", "Suggestions"],
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: {
              type: "string",
              description: "Partial query",
              minLength: 1,
            },
            context: {
              type: "string",
              description: "JSON-encoded context",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    aiController.getSuggestions,
  )

  // AI status endpoint
  fastify.get(
    "/status",
    {
      schema: {
        description: "Get AI service status",
        tags: ["AI", "Health"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  service: { type: "string" },
                  timestamp: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    aiController.getAIStatus,
  )
}

export default aiRoutes
