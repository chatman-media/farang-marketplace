import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { aiClient } from "../services/AIClient"

// Validation schemas
const enhancedSearchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  filters: z.record(z.string(), z.any()).optional(),
  userContext: z
    .object({
      userId: z.string().optional(),
      location: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
      previousSearches: z.array(z.string()).optional(),
      preferences: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  preferredProvider: z.enum(["openai", "deepseek", "claude"]).optional(),
})

const queryAnalysisSchema = z.object({
  query: z.string().min(1, "Query is required"),
})

const recommendationsSchema = z.object({
  userId: z.string(),
  listingId: z.string().optional(),
  category: z.string().optional(),
  userBehavior: z.record(z.string(), z.any()).optional(),
  context: z.record(z.string(), z.any()).optional(),
})

const priceSuggestionsSchema = z.object({
  listingId: z.string(),
  category: z.string(),
  location: z.object({
    city: z.string(),
    region: z.string(),
    country: z.string(),
  }),
  features: z.record(z.string(), z.any()),
  currentPrice: z.number().optional(),
})

const suggestionsSchema = z.object({
  q: z.string().min(1, "Partial query is required"),
  context: z.string().optional(),
})

export class AIIntegrationController {
  /**
   * Enhanced search using AI service
   */
  enhancedSearch = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = enhancedSearchSchema.parse(request.body)

      const results = await aiClient.enhanceSearch({
        query: body.query,
        filters: body.filters,
        userContext: body.userContext,
        preferredProvider: body.preferredProvider,
      })

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

  /**
   * Query analysis using AI service
   */
  analyzeQuery = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = queryAnalysisSchema.parse(request.body)

      const analysis = await aiClient.analyzeQuery(body.query)

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

  /**
   * Get AI recommendations
   */
  getRecommendations = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = recommendationsSchema.parse(request.body)

      const recommendations = await aiClient.getRecommendations({
        userId: body.userId,
        listingId: body.listingId,
        category: body.category,
        userBehavior: body.userBehavior,
        context: body.context,
      })

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

  /**
   * Get price suggestions
   */
  getPriceSuggestions = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = priceSuggestionsSchema.parse(request.body)

      const suggestions = await aiClient.getPriceSuggestions({
        listingId: body.listingId,
        category: body.category,
        location: body.location,
        features: body.features,
        currentPrice: body.currentPrice,
      })

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

      console.error("Get price suggestions error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to get price suggestions",
      })
    }
  }

  /**
   * Generate search suggestions
   */
  getSuggestions = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = suggestionsSchema.parse(request.query)

      const context = query.context ? JSON.parse(query.context) : undefined
      const suggestions = await aiClient.generateSuggestions(query.q, context)

      return reply.send({
        success: true,
        data: {
          suggestions,
        },
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

  /**
   * Get AI service status
   */
  getAIStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isHealthy = await aiClient.checkHealth()

      return reply.send({
        success: true,
        data: {
          status: isHealthy ? "healthy" : "unhealthy",
          service: "ai-service",
          timestamp: new Date().toISOString(),
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
}
