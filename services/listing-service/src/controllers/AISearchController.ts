import { FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { AIService } from "../ai/AIService"
import { getAIConfig, validateAIConfig } from "../ai/config"
import type { SearchQuery, RecommendationRequest, ServiceMatchingRequest, AIProvider } from "../ai/types"

// Zod schemas for validation
const enhancedSearchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z
    .object({
      type: z.enum(["vehicle", "product", "service"]).optional(),
      category: z.string().max(100).optional(),
      priceRange: z
        .object({
          min: z.number().min(0),
          max: z.number().min(0),
        })
        .optional(),
      location: z.string().max(200).optional(),
      availability: z.boolean().optional(),
    })
    .optional(),
  userContext: z
    .object({
      userId: z.string().uuid().optional(),
      location: z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
        .optional(),
    })
    .optional(),
  preferredProvider: z.enum(["openai", "deepseek", "claude"]).optional(),
})

const queryAnalysisSchema = z.object({
  query: z.string().min(1).max(500),
  preferredProvider: z.enum(["openai", "deepseek", "claude"]).optional(),
})

const suggestionsSchema = z.object({
  q: z.string().min(1).max(100),
  provider: z.enum(["openai", "deepseek", "claude"]).optional(),
})

const recommendationsSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["similar", "personalized", "trending", "location-based"]),
  context: z.object({}).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  preferredProvider: z.enum(["openai", "deepseek", "claude"]).optional(),
})

const serviceMatchingSchema = z.object({
  requirements: z.object({
    serviceType: z.string().min(1),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radius: z.number().optional(),
    }),
    budget: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .optional(),
    timeframe: z
      .object({
        start: z.string(),
        end: z.string(),
      })
      .optional(),
    preferences: z.array(z.string()).optional(),
    specialRequirements: z.string().optional(),
  }),
  userProfile: z.object({}).optional(),
  preferredProvider: z.enum(["openai", "deepseek", "claude"]).optional(),
})

export class AISearchController {
  private aiService: AIService

  constructor() {
    const config = getAIConfig()
    const validation = validateAIConfig(config)

    if (!validation.valid) {
      console.error("AI Configuration errors:", validation.errors)
      throw new Error("Invalid AI configuration")
    }

    if (validation.warnings.length > 0) {
      console.warn("AI Configuration warnings:", validation.warnings)
    }

    this.aiService = new AIService(config)
  }

  // AI-Enhanced Search
  enhancedSearch = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = enhancedSearchSchema.parse(request.body)

      const searchQuery: SearchQuery = {
        query: body.query,
        filters: body.filters || {},
        userContext: body.userContext,
        preferredProvider: body.preferredProvider as AIProvider,
      }

      const results = await this.aiService.enhanceSearch(searchQuery)

      return reply.send({
        success: true,
        data: results,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation Error",
          errors: error.issues,
        })
      }

      console.error("Enhanced search error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to perform enhanced search",
      })
    }
  }

  // Query Analysis
  analyzeQuery = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = queryAnalysisSchema.parse(request.body)

      const analysis = await this.aiService.analyzeQuery(body.query, body.preferredProvider as AIProvider)

      return reply.send({
        success: true,
        data: analysis,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation Error",
          errors: error.issues,
        })
      }

      console.error("Query analysis error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to analyze query",
      })
    }
  }

  // Get Suggestions
  getSuggestions = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = suggestionsSchema.parse(request.query)

      const suggestions = await this.aiService.generateSuggestions(query.q, undefined, query.provider as AIProvider)

      return reply.send({
        success: true,
        data: suggestions,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation Error",
          errors: error.issues,
        })
      }

      console.error("Get suggestions error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to get suggestions",
      })
    }
  }

  // Get Recommendations
  getRecommendations = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = recommendationsSchema.parse(request.body)

      const recommendationRequest: RecommendationRequest = {
        userId: body.userId,
        type: body.type,
        context: body.context,
        limit: body.limit,
      }

      const recommendations = await this.aiService.generateRecommendations(
        recommendationRequest,
        body.preferredProvider as AIProvider,
      )

      return reply.send({
        success: true,
        data: recommendations,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation Error",
          errors: error.issues,
        })
      }

      console.error("Get recommendations error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to get recommendations",
      })
    }
  }

  // Match Services
  matchServices = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = serviceMatchingSchema.parse(request.body)

      const serviceMatchingRequest: ServiceMatchingRequest = {
        requirements: body.requirements,
        userProfile: body.userProfile,
        preferredProvider: body.preferredProvider as AIProvider,
      }

      const matches = await this.aiService.matchServices(serviceMatchingRequest)

      return reply.send({
        success: true,
        data: matches,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation Error",
          errors: error.issues,
        })
      }

      console.error("Service matching error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to match services",
      })
    }
  }

  // Get AI Status
  getAIStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = await this.aiService.getProviderHealth()
      const metrics = this.aiService.getMetrics()

      return reply.send({
        success: true,
        data: {
          health,
          metrics,
          availableProviders: this.aiService.getAvailableProviders(),
        },
      })
    } catch (error) {
      console.error("Get AI status error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to get AI status",
      })
    }
  }

  // Get Cost Estimate
  getCostEstimate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { operation = "search", dataSize = 1000 } = request.query as { operation?: string; dataSize?: number }
      const estimate = await this.aiService.getCostEstimate(operation, dataSize)

      return reply.send({
        success: true,
        data: estimate,
      })
    } catch (error) {
      console.error("Get cost estimate error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to get cost estimate",
      })
    }
  }
}
