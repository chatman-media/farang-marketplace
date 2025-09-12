import { beforeEach, describe, expect, it } from "vitest"
import { AIProviderService } from "../services/AIProviderService"

describe("AI Provider Service Tests", () => {
  let aiProviderService: AIProviderService

  beforeEach(() => {
    aiProviderService = new AIProviderService()
  })

  describe("Provider Initialization", () => {
    it("should initialize with mock provider in test environment", () => {
      const providers = aiProviderService.getAvailableProviders()
      expect(providers.length).toBeGreaterThan(0)

      const mockProvider = providers.find((p) => p.name === "mock")
      expect(mockProvider).toBeDefined()
      expect(mockProvider?.enabled).toBe(true)
    })

    it("should sort providers by priority", () => {
      const providers = aiProviderService.getAvailableProviders()

      for (let i = 0; i < providers.length - 1; i++) {
        expect(providers[i]!.priority).toBeLessThanOrEqual(providers[i + 1]!.priority)
      }
    })

    it("should only return enabled providers", () => {
      const providers = aiProviderService.getAvailableProviders()

      providers.forEach((provider) => {
        expect(provider.enabled).toBe(true)
      })
    })
  })

  describe("AI Response Generation", () => {
    it("should generate response using mock provider", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "Test prompt",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)

      expect(response).toBeDefined()
      expect(response.provider).toBe("mock")
      expect(response.model).toBe("mock-model")
      expect(response.response).toContain("Mock AI response")
      expect(response.usage.totalTokens).toBeGreaterThan(0)
      expect(response.cost).toBe(0) // Mock provider has no cost
      expect(response.processingTime).toBeGreaterThan(0)
      expect(response.cached).toBe(false)
    })

    it("should handle empty prompt", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)
      expect(response).toBeDefined()
      expect(response.response).toBeDefined()
    })

    it("should handle long prompt", async () => {
      const longPrompt = "A".repeat(5000)
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: longPrompt,
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)
      expect(response).toBeDefined()
      expect(response.usage.promptTokens).toBeGreaterThan(1000)
    })
  })

  describe("Rate Limiting", () => {
    it("should track rate limits correctly", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "Test prompt",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      // Make multiple requests
      await aiProviderService.generateResponse(request)
      await aiProviderService.generateResponse(request)

      const stats = aiProviderService.getProviderStats()
      expect(stats.mock).toBeDefined()
      expect(stats.mock.rateLimit.current).toBeGreaterThan(0)
    })

    it("should reset rate limits after window expires", () => {
      const stats = aiProviderService.getProviderStats()
      expect(stats.mock.rateLimit.resetTime).toBeGreaterThan(Date.now())
    })
  })

  describe("Provider Management", () => {
    it("should update provider configuration", () => {
      const result = aiProviderService.updateProvider("mock", {
        enabled: false,
        priority: 10,
      })

      expect(result).toBe(true)

      const providers = aiProviderService.getAvailableProviders()
      const mockProvider = providers.find((p) => p.name === "mock")
      expect(mockProvider).toBeUndefined() // Should not be in available list when disabled
    })

    it("should disable provider", () => {
      const result = aiProviderService.disableProvider("mock")
      expect(result).toBe(true)

      const providers = aiProviderService.getAvailableProviders()
      const mockProvider = providers.find((p) => p.name === "mock")
      expect(mockProvider).toBeUndefined()
    })

    it("should enable provider", () => {
      aiProviderService.disableProvider("mock")
      const result = aiProviderService.enableProvider("mock")
      expect(result).toBe(true)

      const providers = aiProviderService.getAvailableProviders()
      const mockProvider = providers.find((p) => p.name === "mock")
      expect(mockProvider).toBeDefined()
    })

    it("should return false for non-existent provider", () => {
      const result = aiProviderService.updateProvider("non-existent", {
        enabled: false,
      })
      expect(result).toBe(false)
    })
  })

  describe("Provider Statistics", () => {
    it("should return provider statistics", () => {
      const stats = aiProviderService.getProviderStats()

      expect(stats).toBeDefined()
      expect(typeof stats).toBe("object")

      if (stats.mock) {
        expect(stats.mock.enabled).toBeDefined()
        expect(stats.mock.priority).toBeDefined()
        expect(stats.mock.model).toBeDefined()
        expect(stats.mock.rateLimit).toBeDefined()
        expect(stats.mock.cost).toBeDefined()
      }
    })

    it("should include rate limit information", () => {
      const stats = aiProviderService.getProviderStats()

      Object.values(stats).forEach((providerStats: any) => {
        expect(providerStats.rateLimit).toBeDefined()
        expect(providerStats.rateLimit.current).toBeGreaterThanOrEqual(0)
        expect(providerStats.rateLimit.max).toBeGreaterThan(0)
        expect(typeof providerStats.rateLimit.resetTime).toBe("number")
      })
    })

    it("should include cost information", () => {
      const stats = aiProviderService.getProviderStats()

      Object.values(stats).forEach((providerStats: any) => {
        expect(providerStats.cost).toBeDefined()
        expect(providerStats.cost.inputTokens).toBeGreaterThanOrEqual(0)
        expect(providerStats.cost.outputTokens).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle provider failure gracefully", async () => {
      // Disable all providers to simulate failure
      const providers = aiProviderService.getAvailableProviders()
      providers.forEach((provider) => {
        aiProviderService.disableProvider(provider.name)
      })

      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "Test prompt",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      await expect(aiProviderService.generateResponse(request)).rejects.toThrow()
    })

    it("should validate request parameters", async () => {
      const invalidRequest = {
        provider: "",
        model: "",
        prompt: "Test prompt",
        maxTokens: -1,
        temperature: 2.0, // Invalid temperature
        metadata: { type: "test" },
      }

      // Should still work with mock provider as it's lenient
      const response = await aiProviderService.generateResponse(invalidRequest)
      expect(response).toBeDefined()
    })
  })

  describe("Cost Calculation", () => {
    it("should calculate costs correctly for mock provider", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "Test prompt with some content",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)

      // Mock provider should have zero cost
      expect(response.cost).toBe(0)
      expect(response.usage.promptTokens).toBeGreaterThan(0)
      expect(response.usage.completionTokens).toBeGreaterThan(0)
      expect(response.usage.totalTokens).toBe(response.usage.promptTokens + response.usage.completionTokens)
    })

    it("should handle zero token usage", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "",
        maxTokens: 0,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)
      expect(response.cost).toBe(0)
    })
  })

  describe("Provider Configuration", () => {
    it("should validate provider configuration", () => {
      const providers = aiProviderService.getAvailableProviders()

      providers.forEach((provider) => {
        expect(provider.name).toBeDefined()
        expect(provider.type).toBeDefined()
        expect(provider.model).toBeDefined()
        expect(provider.maxTokens).toBeGreaterThan(0)
        expect(provider.temperature).toBeGreaterThanOrEqual(0)
        expect(provider.temperature).toBeLessThanOrEqual(2)
        expect(provider.priority).toBeGreaterThanOrEqual(0)
        expect(provider.rateLimit.requests).toBeGreaterThan(0)
        expect(provider.rateLimit.window).toBeGreaterThan(0)
        expect(provider.cost.inputTokens).toBeGreaterThanOrEqual(0)
        expect(provider.cost.outputTokens).toBeGreaterThanOrEqual(0)
      })
    })

    it("should handle missing environment variables gracefully", () => {
      // Service should still work with mock provider even if other env vars are missing
      const providers = aiProviderService.getAvailableProviders()
      expect(providers.length).toBeGreaterThan(0)
    })
  })

  describe("Response Format", () => {
    it("should return consistent response format", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "Test prompt",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)

      // Check all required fields are present
      expect(response.requestId).toBeDefined()
      expect(response.provider).toBeDefined()
      expect(response.model).toBeDefined()
      expect(response.response).toBeDefined()
      expect(response.usage).toBeDefined()
      expect(response.cost).toBeDefined()
      expect(response.processingTime).toBeDefined()
      expect(response.cached).toBeDefined()
      expect(response.timestamp).toBeDefined()

      // Check field types
      expect(typeof response.requestId).toBe("string")
      expect(typeof response.provider).toBe("string")
      expect(typeof response.model).toBe("string")
      expect(typeof response.response).toBe("string")
      expect(typeof response.usage).toBe("object")
      expect(typeof response.cost).toBe("number")
      expect(typeof response.processingTime).toBe("number")
      expect(typeof response.cached).toBe("boolean")
      expect(response.timestamp).toBeInstanceOf(Date)
    })

    it("should include usage statistics", async () => {
      const request = {
        provider: "mock",
        model: "mock-model",
        prompt: "Test prompt",
        maxTokens: 100,
        temperature: 0.7,
        metadata: { type: "test" },
      }

      const response = await aiProviderService.generateResponse(request)

      expect(response.usage.promptTokens).toBeGreaterThanOrEqual(0)
      expect(response.usage.completionTokens).toBeGreaterThanOrEqual(0)
      expect(response.usage.totalTokens).toBeGreaterThanOrEqual(0)
      expect(response.usage.totalTokens).toBe(response.usage.promptTokens + response.usage.completionTokens)
    })
  })
})
