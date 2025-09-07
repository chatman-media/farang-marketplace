import { Request, Response } from "express"
import { body, query, validationResult } from "express-validator"
import { AIService } from "../ai/AIService.js"
import { getAIConfig, validateAIConfig } from "../ai/config.js"
import type {
  SearchQuery,
  RecommendationRequest,
  ServiceMatchingRequest,
  AIProvider,
} from "../ai/types.js"

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

  // Validation rules for AI-enhanced search
  static enhancedSearchValidation = [
    body("query")
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage("Query must be 1-500 characters"),
    body("filters").optional().isObject().withMessage("Filters must be an object"),
    body("filters.type")
      .optional()
      .isIn(["vehicle", "product", "service"])
      .withMessage("Invalid type filter"),
    body("filters.category").optional().isString().isLength({ max: 100 }),
    body("filters.priceRange").optional().isObject(),
    body("filters.priceRange.min").optional().isFloat({ min: 0 }),
    body("filters.priceRange.max").optional().isFloat({ min: 0 }),
    body("filters.location").optional().isString().isLength({ max: 200 }),
    body("userContext").optional().isObject(),
    body("userContext.userId").optional().isUUID(),
    body("userContext.location").optional().isObject(),
    body("userContext.location.latitude").optional().isFloat({ min: -90, max: 90 }),
    body("userContext.location.longitude").optional().isFloat({ min: -180, max: 180 }),
    body("preferredProvider").optional().isIn(["openai", "deepseek", "claude"]),
  ]

  // AI-Enhanced Search
  enhancedSearch = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const searchQuery: SearchQuery = {
        query: req.body.query,
        filters: req.body.filters,
        userContext: req.body.userContext,
      }

      const preferredProvider = req.body.preferredProvider as AIProvider

      const startTime = Date.now()
      const searchResponse = await this.aiService.enhanceSearch(searchQuery, preferredProvider)
      const processingTime = Date.now() - startTime

      res.json({
        success: true,
        data: searchResponse,
        metadata: {
          processingTime,
          aiProvider: preferredProvider || "auto-selected",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Enhanced search error:", error)
      res.status(500).json({
        success: false,
        message: "AI-enhanced search failed",
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: "Consider using basic search",
      })
    }
  }

  // Query Analysis
  static queryAnalysisValidation = [
    body("query").isString().isLength({ min: 1, max: 500 }),
    body("preferredProvider").optional().isIn(["openai", "deepseek", "claude"]),
  ]

  analyzeQuery = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { query, preferredProvider } = req.body

      const analysis = await this.aiService.analyzeQuery(query, preferredProvider)

      res.json({
        success: true,
        data: analysis,
        metadata: {
          query,
          provider: preferredProvider || "auto-selected",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Query analysis error:", error)
      res.status(500).json({
        success: false,
        message: "Query analysis failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Auto-suggestions
  static suggestionsValidation = [
    query("q")
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage("Query must be 1-100 characters"),
    query("provider").optional().isIn(["openai", "deepseek", "claude"]),
  ]

  getSuggestions = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const partialQuery = req.query.q as string
      const preferredProvider = req.query.provider as AIProvider
      const context = req.query.context ? JSON.parse(req.query.context as string) : undefined

      const suggestions = await this.aiService.generateSuggestions(
        partialQuery,
        context,
        preferredProvider
      )

      res.json({
        success: true,
        data: {
          query: partialQuery,
          suggestions,
        },
        metadata: {
          provider: preferredProvider || "auto-selected",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Suggestions error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to generate suggestions",
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          query: req.query.q,
          suggestions: [], // Empty fallback
        },
      })
    }
  }

  // Recommendations
  static recommendationsValidation = [
    body("userId").isUUID().withMessage("Valid user ID required"),
    body("type").isIn(["similar", "personalized", "trending", "location-based"]),
    body("context").optional().isObject(),
    body("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be 1-50"),
    body("preferredProvider").optional().isIn(["openai", "deepseek", "claude"]),
  ]

  getRecommendations = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const recommendationRequest: RecommendationRequest = {
        userId: req.body.userId,
        type: req.body.type,
        context: req.body.context,
        limit: req.body.limit || 10,
      }

      const preferredProvider = req.body.preferredProvider as AIProvider

      const recommendations = await this.aiService.generateRecommendations(
        recommendationRequest,
        preferredProvider
      )

      res.json({
        success: true,
        data: recommendations,
        metadata: {
          provider: preferredProvider || "auto-selected",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Recommendations error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to generate recommendations",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Service Matching
  static serviceMatchingValidation = [
    body("requirements").isObject().withMessage("Requirements object required"),
    body("requirements.serviceType").isString().notEmpty(),
    body("requirements.location").isObject(),
    body("requirements.location.latitude").isFloat({ min: -90, max: 90 }),
    body("requirements.location.longitude").isFloat({ min: -180, max: 180 }),
    body("requirements.budget").optional().isObject(),
    body("userProfile").optional().isObject(),
    body("preferredProvider").optional().isIn(["openai", "deepseek", "claude"]),
  ]

  matchServices = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const serviceMatchingRequest: ServiceMatchingRequest = {
        requirements: req.body.requirements,
        userProfile: req.body.userProfile,
      }

      const preferredProvider = req.body.preferredProvider as AIProvider

      const matches = await this.aiService.matchServices(serviceMatchingRequest, preferredProvider)

      res.json({
        success: true,
        data: matches,
        metadata: {
          provider: preferredProvider || "auto-selected",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Service matching error:", error)
      res.status(500).json({
        success: false,
        message: "Service matching failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // AI Service Status and Metrics
  getAIStatus = async (req: Request, res: Response) => {
    try {
      const [health, metrics] = await Promise.all([
        this.aiService.getProviderHealth(),
        this.aiService.getMetrics(),
      ])

      const availableProviders = this.aiService.getAvailableProviders()

      res.json({
        success: true,
        data: {
          availableProviders,
          health,
          metrics,
          configuration: {
            defaultProvider: getAIConfig().defaultProvider,
            fallbackProviders: getAIConfig().fallbackProviders,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("AI status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to get AI service status",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Cost Estimation
  getCostEstimate = async (req: Request, res: Response) => {
    try {
      const { operation, dataSize } = req.query

      if (!operation || !dataSize) {
        return res.status(400).json({
          success: false,
          message: "Operation and dataSize parameters required",
        })
      }

      const estimates = await this.aiService.getCostEstimate(
        operation as string,
        parseInt(dataSize as string)
      )

      const optimalProvider = await this.aiService.getOptimalProvider(
        operation as string,
        parseInt(dataSize as string)
      )

      res.json({
        success: true,
        data: {
          estimates,
          optimalProvider,
          operation,
          dataSize: parseInt(dataSize as string),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Cost estimation error:", error)
      res.status(500).json({
        success: false,
        message: "Cost estimation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
}
