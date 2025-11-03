import logger from "@marketplace/logger"
import axios, { AxiosInstance } from "axios"

export interface SearchEnhancementRequest {
  query: string
  filters?: Record<string, any>
  userContext?: {
    userId?: string
    location?: {
      latitude: number
      longitude: number
    }
    previousSearches?: string[]
    preferences?: Record<string, any>
  }
  preferredProvider?: "openai" | "deepseek" | "claude"
}

export interface SearchEnhancementResponse {
  enhancedQuery: string
  suggestions: string[]
  filters: Record<string, any>
  aiInsights: {
    queryUnderstanding: string
    searchStrategy: string
    recommendations: string[]
  }
  processingTime: number
}

export interface RecommendationRequest {
  userId: string
  listingId?: string
  category?: string
  userBehavior?: Record<string, any>
  context?: Record<string, any>
}

export interface RecommendationResponse {
  recommendations: Array<{
    listingId: string
    score: number
    reason: string
    type: "similar" | "complementary" | "trending" | "personalized"
  }>
  metadata: {
    algorithm: string
    confidence: number
    factors: string[]
  }
}

export interface PriceSuggestionRequest {
  listingId: string
  category: string
  location: {
    city: string
    region: string
    country: string
  }
  features: Record<string, any>
  currentPrice?: number
}

export interface PriceSuggestionResponse {
  suggestedPrice: number
  priceRange: { min: number; max: number }
  confidence: number
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
  marketData: {
    averagePrice: number
    competitorPrices: number[]
    demandLevel: "low" | "medium" | "high"
    seasonality: number
  }
}

export class AIClient {
  private client: AxiosInstance
  private baseURL: string

  constructor(baseURL: string = process.env.AI_SERVICE_URL || "http://localhost:3006") {
    this.baseURL = baseURL
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`AI Service Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error("AI Service Request Error:", error)
        return Promise.reject(error)
      },
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error("AI Service Response Error:", error.response?.data || error.message)
        return Promise.reject(error)
      },
    )
  }

  /**
   * Enhance search query using AI
   */
  async enhanceSearch(request: SearchEnhancementRequest): Promise<SearchEnhancementResponse> {
    try {
      const response = await this.client.post("/api/ai/search/enhanced", request)
      return response.data.data
    } catch (error) {
      logger.error("Failed to enhance search:", error)
      // Return fallback response
      return {
        enhancedQuery: request.query,
        suggestions: [],
        filters: request.filters || {},
        aiInsights: {
          queryUnderstanding: "AI service unavailable",
          searchStrategy: "Basic keyword search",
          recommendations: [],
        },
        processingTime: 0,
      }
    }
  }

  /**
   * Get AI-powered recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const response = await this.client.post("/api/recommendations/generate", request)
      return response.data.data
    } catch (error) {
      logger.error("Failed to get recommendations:", error)
      return {
        recommendations: [],
        metadata: {
          algorithm: "fallback",
          confidence: 0,
          factors: [],
        },
      }
    }
  }

  /**
   * Get AI-powered price suggestions
   */
  async getPriceSuggestions(request: PriceSuggestionRequest): Promise<PriceSuggestionResponse> {
    try {
      const response = await this.client.post("/api/marketplace-integration/price-suggestions", request)
      return response.data.data
    } catch (error) {
      logger.error("Failed to get price suggestions:", error)
      return {
        suggestedPrice: request.currentPrice || 0,
        priceRange: { min: 0, max: 0 },
        confidence: 0,
        factors: [],
        marketData: {
          averagePrice: 0,
          competitorPrices: [],
          demandLevel: "medium",
          seasonality: 1,
        },
      }
    }
  }

  /**
   * Analyze query intent and extract entities
   */
  async analyzeQuery(query: string): Promise<{
    intent: string
    entities: Record<string, any>
    suggestions: string[]
    confidence: number
  }> {
    try {
      const response = await this.client.post("/api/content-analysis/analyze", {
        content: query,
        type: "search_query",
      })

      const analysis = response.data.data
      return {
        intent: analysis.intent || "search",
        entities: analysis.entities || {},
        suggestions: analysis.suggestions || [],
        confidence: analysis.confidence || 0.5,
      }
    } catch (error) {
      logger.error("Failed to analyze query:", error)
      return {
        intent: "search",
        entities: {},
        suggestions: [],
        confidence: 0,
      }
    }
  }

  /**
   * Generate search suggestions
   */
  async generateSuggestions(partialQuery: string, context?: any): Promise<string[]> {
    try {
      const response = await this.client.get("/api/ai/suggestions", {
        params: {
          q: partialQuery,
          context: context ? JSON.stringify(context) : undefined,
        },
      })
      return response.data.data.suggestions || []
    } catch (error) {
      logger.error("Failed to generate suggestions:", error)
      return []
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get("/health")
      return response.data.status === "healthy"
    } catch (error) {
      logger.error("AI service health check failed:", error)
      return false
    }
  }
}

// Singleton instance
export const aiClient = new AIClient()
