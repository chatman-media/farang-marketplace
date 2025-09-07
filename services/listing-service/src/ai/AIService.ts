import {
  AIProvider,
  type AIProviderInterface,
  type AIProviderConfig,
  type SearchQuery,
  type SearchResult,
  type SearchResponse,
  type RecommendationRequest,
  type RecommendationResponse,
  type ServiceMatchingRequest,
  type ServiceMatchingResponse,
  type AIMetrics,
  type AIError,
} from "./types.js"

import { OpenAIProvider } from "./providers/OpenAIProvider.js"
import { DeepSeekProvider } from "./providers/DeepSeekProvider.js"
import { ClaudeProvider } from "./providers/ClaudeProvider.js"

export class AIService {
  private providers: Map<AIProvider, AIProviderInterface> = new Map()
  private config: AIProviderConfig
  private currentProvider: AIProvider
  private rateLimitTracker: Map<AIProvider, { requests: number; resetTime: number }> = new Map()

  constructor(config: AIProviderConfig) {
    this.config = config
    this.currentProvider = config.defaultProvider
    this.initializeProviders()
    this.initializeRateLimitTracking()
  }

  private initializeProviders(): void {
    // Initialize OpenAI provider
    if (this.config.openai) {
      const openaiProvider = new OpenAIProvider({
        apiKey: this.config.openai.apiKey,
        model: this.config.openai.model,
        maxTokens: this.config.openai.maxTokens,
        temperature: this.config.openai.temperature,
      })
      this.providers.set(AIProvider.OPENAI, openaiProvider)
    }

    // Initialize DeepSeek provider
    if (this.config.deepseek) {
      const deepseekProvider = new DeepSeekProvider({
        apiKey: this.config.deepseek.apiKey,
        model: this.config.deepseek.model,
        maxTokens: this.config.deepseek.maxTokens,
        temperature: this.config.deepseek.temperature,
      })
      this.providers.set(AIProvider.DEEPSEEK, deepseekProvider)
    }

    // Initialize Claude provider
    if (this.config.claude) {
      const claudeProvider = new ClaudeProvider({
        apiKey: this.config.claude.apiKey,
        model: this.config.claude.model,
        maxTokens: this.config.claude.maxTokens,
        temperature: this.config.claude.temperature,
      })
      this.providers.set(AIProvider.CLAUDE, claudeProvider)
    }
  }

  private initializeRateLimitTracking(): void {
    Object.values(AIProvider).forEach((provider) => {
      this.rateLimitTracker.set(provider, {
        requests: 0,
        resetTime: Date.now() + 60000, // Reset every minute
      })
    })
  }

  private checkRateLimit(provider: AIProvider): boolean {
    const tracker = this.rateLimitTracker.get(provider)
    if (!tracker) return true

    const now = Date.now()
    if (now > tracker.resetTime) {
      // Reset counter
      tracker.requests = 0
      tracker.resetTime = now + 60000
    }

    const limits = this.config.rateLimits[provider]
    return tracker.requests < limits.requestsPerMinute
  }

  private incrementRateLimit(provider: AIProvider): void {
    const tracker = this.rateLimitTracker.get(provider)
    if (tracker) {
      tracker.requests++
    }
  }

  private async executeWithFallback<T>(
    operation: (provider: AIProviderInterface) => Promise<T>,
    preferredProvider?: AIProvider
  ): Promise<T> {
    const providersToTry = [
      preferredProvider || this.currentProvider,
      ...this.config.fallbackProviders,
    ].filter(
      (provider, index, arr) => provider && arr.indexOf(provider) === index // Remove duplicates
    )

    let lastError: AIError | null = null

    for (const providerType of providersToTry) {
      const provider = this.providers.get(providerType)
      if (!provider) continue

      // Check rate limits
      if (!this.checkRateLimit(providerType)) {
        console.warn(`Rate limit exceeded for ${providerType}, trying next provider`)
        continue
      }

      try {
        this.incrementRateLimit(providerType)
        const result = await operation(provider)

        // Update current provider if different and successful
        if (providerType !== this.currentProvider) {
          console.log(`Successfully used fallback provider: ${providerType}`)
        }

        return result
      } catch (error) {
        lastError = error as AIError
        console.error(
          `Provider ${providerType} failed:`,
          error instanceof Error ? error.message : String(error)
        )

        // If error is not retryable, don't try other providers
        if (lastError && !lastError.retryable) {
          break
        }
      }
    }

    throw lastError || new Error("All AI providers failed")
  }

  // Public API methods
  async enhanceSearch(query: SearchQuery, preferredProvider?: AIProvider): Promise<SearchResponse> {
    const startTime = Date.now()

    try {
      const enhancement = await this.executeWithFallback(
        (provider) => provider.enhanceSearch(query),
        preferredProvider
      )

      // Mock search results for now - in real implementation, this would query the database
      const mockResults: SearchResult[] = [
        {
          id: "1",
          type: "vehicle",
          title: "Honda PCX 150 Scooter",
          description: "Reliable scooter for city riding",
          price: 300,
          currency: "THB",
          location: "Bangkok",
          images: ["scooter1.jpg"],
          rating: 4.5,
          relevanceScore: 95,
          aiReason: "Perfect match for scooter rental query",
        },
      ]

      const rankedResults = await this.executeWithFallback(
        (provider) => provider.rankResults(mockResults, query),
        preferredProvider
      )

      const suggestions = await this.executeWithFallback(
        (provider) => provider.generateSuggestions(query.query, query.userContext),
        preferredProvider
      )

      return {
        results: rankedResults,
        total: rankedResults.length,
        query: enhancement.enhancedQuery,
        suggestions,
        filters: enhancement.filters,
        aiInsights: {
          queryUnderstanding: enhancement.insights,
          searchStrategy: enhancement.searchStrategy,
          recommendations: suggestions,
        },
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error("AI-enhanced search failed:", error)

      // Fallback to basic search
      return {
        results: [],
        total: 0,
        query: query.query,
        suggestions: [],
        filters: {},
        aiInsights: {
          queryUnderstanding: "AI enhancement failed, using basic search",
          searchStrategy: "Fallback search",
          recommendations: [],
        },
        processingTime: Date.now() - startTime,
      }
    }
  }

  async generateRecommendations(
    request: RecommendationRequest,
    preferredProvider?: AIProvider
  ): Promise<RecommendationResponse> {
    return this.executeWithFallback(
      (provider) => provider.generateRecommendations(request),
      preferredProvider
    )
  }

  async matchServices(
    request: ServiceMatchingRequest,
    preferredProvider?: AIProvider
  ): Promise<ServiceMatchingResponse> {
    return this.executeWithFallback(
      (provider) => provider.matchServices(request),
      preferredProvider
    )
  }

  async analyzeQuery(
    query: string,
    preferredProvider?: AIProvider
  ): Promise<{
    intent: string
    entities: Record<string, any>
    suggestions: string[]
    confidence: number
  }> {
    return this.executeWithFallback((provider) => provider.analyzeQuery(query), preferredProvider)
  }

  async generateSuggestions(
    partialQuery: string,
    context?: any,
    preferredProvider?: AIProvider
  ): Promise<string[]> {
    return this.executeWithFallback(
      (provider) => provider.generateSuggestions(partialQuery, context),
      preferredProvider
    )
  }

  // Provider management
  setDefaultProvider(provider: AIProvider): void {
    if (this.providers.has(provider)) {
      this.currentProvider = provider
    } else {
      throw new Error(`Provider ${provider} is not configured`)
    }
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
  }

  async getProviderHealth(): Promise<Record<AIProvider, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [provider, instance] of this.providers) {
      try {
        // Simple health check
        await instance.generateSuggestions("test", {})
        health[provider] = true
      } catch (error) {
        health[provider] = false
      }
    }

    return health as Record<AIProvider, boolean>
  }

  getMetrics(): Record<AIProvider, AIMetrics> {
    const metrics: Record<string, AIMetrics> = {}

    for (const [provider, instance] of this.providers) {
      if ("getMetrics" in instance && typeof instance.getMetrics === "function") {
        metrics[provider] = (instance as any).getMetrics()
      }
    }

    return metrics as Record<AIProvider, AIMetrics>
  }

  // Cost optimization
  async getCostEstimate(operation: string, dataSize: number): Promise<Record<AIProvider, number>> {
    const estimates: Record<string, number> = {}

    // Rough token estimation based on operation and data size
    const tokenEstimate = Math.ceil(dataSize / 4) + 500 // Base tokens for operation

    for (const [provider, instance] of this.providers) {
      if ("calculateCost" in instance && typeof (instance as any).calculateCost === "function") {
        estimates[provider] = (instance as any).calculateCost(tokenEstimate)
      }
    }

    return estimates as Record<AIProvider, number>
  }

  async getOptimalProvider(operation: string, dataSize: number): Promise<AIProvider> {
    const costs = await this.getCostEstimate(operation, dataSize)
    const health = await this.getProviderHealth()

    // Find the cheapest healthy provider
    let optimalProvider = this.currentProvider
    let lowestCost = Infinity

    for (const [provider, cost] of Object.entries(costs)) {
      if (health[provider as AIProvider] && cost < lowestCost) {
        lowestCost = cost
        optimalProvider = provider as AIProvider
      }
    }

    return optimalProvider
  }

  // Configuration updates
  updateConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Reinitialize providers if needed
    if (newConfig.openai || newConfig.deepseek || newConfig.claude) {
      this.initializeProviders()
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    // Perform any necessary cleanup
    this.providers.clear()
    this.rateLimitTracker.clear()
  }
}
