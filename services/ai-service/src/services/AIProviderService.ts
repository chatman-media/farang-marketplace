import axios from "axios"
import OpenAI from "openai"

import type { AIError, AIProviderConfig, AIRequest, AIResponse } from "../models/index"

export class AIProviderService {
  private providers: Map<string, AIProviderConfig> = new Map()
  private clients: Map<string, any> = new Map()
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map()

  constructor() {
    this.initializeProviders()
  }

  /**
   * Initialize AI providers from environment configuration
   */
  private initializeProviders(): void {
    // OpenAI Configuration
    if (process.env.OPENAI_API_KEY) {
      const openaiConfig: AIProviderConfig = {
        name: "openai",
        type: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        maxTokens: Number.parseInt(process.env.OPENAI_MAX_TOKENS || "4000"),
        temperature: 0.7,
        enabled: true,
        priority: 1,
        rateLimit: {
          requests: Number.parseInt(process.env.AI_RATE_LIMIT_REQUESTS || "100"),
          window: Number.parseInt(process.env.AI_RATE_LIMIT_WINDOW || "3600"),
        },
        cost: {
          inputTokens: 0.01, // $0.01 per 1k tokens
          outputTokens: 0.03, // $0.03 per 1k tokens
        },
      }

      this.providers.set("openai", openaiConfig)
      this.clients.set(
        "openai",
        new OpenAI({
          apiKey: openaiConfig.apiKey,
        }),
      )
    }

    // DeepSeek Configuration
    if (process.env.DEEPSEEK_API_KEY) {
      const deepseekConfig: AIProviderConfig = {
        name: "deepseek",
        type: "deepseek",
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        maxTokens: 4000,
        temperature: 0.7,
        enabled: true,
        priority: 2,
        rateLimit: {
          requests: Number.parseInt(process.env.AI_RATE_LIMIT_REQUESTS || "100"),
          window: Number.parseInt(process.env.AI_RATE_LIMIT_WINDOW || "3600"),
        },
        cost: {
          inputTokens: 0.0014, // $0.0014 per 1k tokens
          outputTokens: 0.0028, // $0.0028 per 1k tokens
        },
      }

      this.providers.set("deepseek", deepseekConfig)
      this.clients.set(
        "deepseek",
        new OpenAI({
          apiKey: deepseekConfig.apiKey,
          baseURL: deepseekConfig.baseUrl,
        }),
      )
    }

    // Claude Configuration
    if (process.env.CLAUDE_API_KEY) {
      const claudeConfig: AIProviderConfig = {
        name: "claude",
        type: "claude",
        apiKey: process.env.CLAUDE_API_KEY,
        model: process.env.CLAUDE_MODEL || "claude-3-sonnet-20240229",
        maxTokens: 4000,
        temperature: 0.7,
        enabled: true,
        priority: 3,
        rateLimit: {
          requests: Number.parseInt(process.env.AI_RATE_LIMIT_REQUESTS || "100"),
          window: Number.parseInt(process.env.AI_RATE_LIMIT_WINDOW || "3600"),
        },
        cost: {
          inputTokens: 0.003, // $0.003 per 1k tokens
          outputTokens: 0.015, // $0.015 per 1k tokens
        },
      }

      this.providers.set("claude", claudeConfig)
    }

    // Mock provider for testing
    if (process.env.NODE_ENV === "test" || process.env.AI_PROVIDER === "mock") {
      const mockConfig: AIProviderConfig = {
        name: "mock",
        type: "custom",
        apiKey: "mock-key",
        model: "mock-model",
        maxTokens: 1000,
        temperature: 0.7,
        enabled: true,
        priority: 0,
        rateLimit: {
          requests: 1000,
          window: 3600,
        },
        cost: {
          inputTokens: 0,
          outputTokens: 0,
        },
      }

      this.providers.set("mock", mockConfig)

      // Initialize rate limit for mock provider
      this.rateLimits.set("mock", {
        count: 0,
        resetTime: Date.now() + mockConfig.rateLimit.window * 1000,
      })
    }
  }

  /**
   * Get available providers sorted by priority
   */
  getAvailableProviders(): AIProviderConfig[] {
    return Array.from(this.providers.values())
      .filter((provider) => provider.enabled)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Check if provider is within rate limits
   */
  private checkRateLimit(providerName: string): boolean {
    const provider = this.providers.get(providerName)
    if (!provider) return false

    const now = Date.now()
    const rateLimit = this.rateLimits.get(providerName)

    if (!rateLimit || now > rateLimit.resetTime) {
      // Reset rate limit window
      this.rateLimits.set(providerName, {
        count: 1,
        resetTime: now + provider.rateLimit.window * 1000,
      })
      return true
    }

    if (rateLimit.count >= provider.rateLimit.requests) {
      return false
    }

    rateLimit.count++
    return true
  }

  /**
   * Generate AI response using the best available provider
   */
  async generateResponse(request: Omit<AIRequest, "id" | "timestamp">): Promise<AIResponse> {
    const requestId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fullRequest: AIRequest = {
      ...request,
      id: requestId,
      timestamp: new Date(),
    }

    // Try providers in order of priority
    const providers = this.getAvailableProviders()
    let lastError: AIError | null = null

    for (const provider of providers) {
      try {
        // Check rate limits
        if (!this.checkRateLimit(provider.name)) {
          continue
        }

        const response = await this.callProvider(provider, fullRequest)
        return response
      } catch (error) {
        lastError = {
          id: `error_${Date.now()}`,
          type: "provider",
          provider: provider.name,
          model: provider.model,
          message: error instanceof Error ? error.message : "Unknown error",
          details: { error },
          requestId,
          retryable: true,
          timestamp: new Date(),
        }

        // console.error(`Provider ${provider.name} failed:`, error)
      }
    }

    // If all providers failed, throw the last error
    if (lastError) {
      throw new Error(`All AI providers failed. Last error: ${lastError.message}`)
    }

    throw new Error("No AI providers available")
  }

  /**
   * Call specific AI provider
   */
  private async callProvider(provider: AIProviderConfig, request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      let response: string
      let usage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }

      if (provider.name === "mock") {
        // Mock response for testing
        await new Promise((resolve) => setTimeout(resolve, 1)) // Small delay for testing
        response = `Mock AI response for: ${request.prompt.substring(0, 50)}...`
        usage = {
          promptTokens: Math.floor(request.prompt.length / 4),
          completionTokens: Math.floor(response.length / 4),
          totalTokens: Math.floor((request.prompt.length + response.length) / 4),
        }
      } else if (provider.type === "openai" || provider.type === "deepseek") {
        const client = this.clients.get(provider.name)
        if (!client) {
          throw new Error(`Client not initialized for provider: ${provider.name}`)
        }

        const completion = await client.chat.completions.create({
          model: provider.model,
          messages: [{ role: "user", content: request.prompt }],
          max_tokens: request.maxTokens || provider.maxTokens,
          temperature: request.temperature || provider.temperature,
        })

        response = completion.choices[0]?.message?.content || ""
        usage = {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        }
      } else if (provider.type === "claude") {
        // Claude API call (simplified)
        const claudeResponse = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: provider.model,
            max_tokens: request.maxTokens || provider.maxTokens,
            messages: [{ role: "user", content: request.prompt }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": provider.apiKey,
              "anthropic-version": "2023-06-01",
            },
          },
        )

        response = claudeResponse.data.content[0]?.text || ""
        usage = {
          promptTokens: claudeResponse.data.usage?.input_tokens || 0,
          completionTokens: claudeResponse.data.usage?.output_tokens || 0,
          totalTokens: (claudeResponse.data.usage?.input_tokens || 0) + (claudeResponse.data.usage?.output_tokens || 0),
        }
      } else {
        throw new Error(`Unsupported provider type: ${provider.type}`)
      }

      const processingTime = Date.now() - startTime
      const cost = this.calculateCost(provider, usage)

      return {
        requestId: request.id,
        provider: provider.name,
        model: provider.model,
        response,
        usage,
        cost,
        processingTime,
        cached: false,
        timestamp: new Date(),
      }
    } catch (error) {
      throw new Error(`Provider ${provider.name} failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Calculate cost for AI request
   */
  private calculateCost(provider: AIProviderConfig, usage: { promptTokens: number; completionTokens: number }): number {
    const inputCost = (usage.promptTokens / 1000) * provider.cost.inputTokens
    const outputCost = (usage.completionTokens / 1000) * provider.cost.outputTokens
    return inputCost + outputCost
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const [name, provider] of this.providers) {
      const rateLimit = this.rateLimits.get(name)
      stats[name] = {
        enabled: provider.enabled,
        priority: provider.priority,
        model: provider.model,
        rateLimit: {
          current: rateLimit?.count || 0,
          max: provider.rateLimit.requests,
          resetTime: rateLimit?.resetTime || 0,
        },
        cost: provider.cost,
      }
    }

    return stats
  }

  /**
   * Update provider configuration
   */
  updateProvider(name: string, updates: Partial<AIProviderConfig>): boolean {
    const provider = this.providers.get(name)
    if (!provider) return false

    Object.assign(provider, updates)
    this.providers.set(name, provider)
    return true
  }

  /**
   * Disable provider
   */
  disableProvider(name: string): boolean {
    return this.updateProvider(name, { enabled: false })
  }

  /**
   * Enable provider
   */
  enableProvider(name: string): boolean {
    return this.updateProvider(name, { enabled: true })
  }
}
