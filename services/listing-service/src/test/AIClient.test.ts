import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock axios so AIClient talks to a controllable fake HTTP client instead of the
// network. We capture the post/get implementations per-test. `vi.hoisted` makes
// these available inside the hoisted vi.mock factory below.
const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }))

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    post,
    get,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }))
  return {
    default: { create },
    create,
  }
})

// Import after the mock is registered.
import { AIClient } from "../services/AIClient"

describe("AIClient (mocked axios)", () => {
  let client: AIClient

  beforeEach(() => {
    post.mockReset()
    get.mockReset()
    client = new AIClient("http://ai.test")
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("enhanceSearch", () => {
    it("returns the AI service payload on success", async () => {
      const data = {
        enhancedQuery: "scooter rental bangkok cheap",
        suggestions: ["honda", "yamaha"],
        filters: { type: "vehicle" },
        aiInsights: { queryUnderstanding: "x", searchStrategy: "y", recommendations: ["z"] },
        processingTime: 12,
      }
      post.mockResolvedValueOnce({ data: { data } })

      const result = await client.enhanceSearch({ query: "scooter rental bangkok" })

      expect(post).toHaveBeenCalledWith("/api/ai/search/enhanced", { query: "scooter rental bangkok" })
      expect(result).toEqual(data)
    })

    it("returns a fallback echoing the query when the call fails", async () => {
      post.mockRejectedValueOnce(new Error("boom"))

      const result = await client.enhanceSearch({ query: "find me a car", filters: { type: "vehicle" } })

      expect(result.enhancedQuery).toBe("find me a car")
      expect(result.suggestions).toEqual([])
      expect(result.filters).toEqual({ type: "vehicle" })
      expect(result.aiInsights.queryUnderstanding).toBe("AI service unavailable")
      expect(result.processingTime).toBe(0)
    })

    it("falls back with an empty filters object when none provided", async () => {
      post.mockRejectedValueOnce(new Error("down"))
      const result = await client.enhanceSearch({ query: "q" })
      expect(result.filters).toEqual({})
    })
  })

  describe("getRecommendations", () => {
    it("returns recommendations on success", async () => {
      const data = {
        recommendations: [{ listingId: "l1", score: 0.9, reason: "popular", type: "trending" }],
        metadata: { algorithm: "v2", confidence: 0.8, factors: ["history"] },
      }
      post.mockResolvedValueOnce({ data: { data } })

      const result = await client.getRecommendations({ userId: "u1" })
      expect(post).toHaveBeenCalledWith("/api/recommendations/generate", { userId: "u1" })
      expect(result).toEqual(data)
    })

    it("returns a fallback with empty recommendations on failure", async () => {
      post.mockRejectedValueOnce(new Error("nope"))
      const result = await client.getRecommendations({ userId: "u1" })
      expect(result.recommendations).toEqual([])
      expect(result.metadata.algorithm).toBe("fallback")
      expect(result.metadata.confidence).toBe(0)
    })
  })

  describe("getPriceSuggestions", () => {
    const req = {
      listingId: "l1",
      category: "vehicle",
      location: { city: "Bangkok", region: "Bangkok", country: "TH" },
      features: { type: "scooter" },
      currentPrice: 300,
    }

    it("returns suggested pricing on success", async () => {
      const data = {
        suggestedPrice: 350,
        priceRange: { min: 300, max: 400 },
        confidence: 0.7,
        factors: [],
        marketData: { averagePrice: 340, competitorPrices: [320, 360], demandLevel: "high", seasonality: 1.2 },
      }
      post.mockResolvedValueOnce({ data: { data } })

      const result = await client.getPriceSuggestions(req)
      expect(post).toHaveBeenCalledWith("/api/marketplace-integration/price-suggestions", req)
      expect(result.suggestedPrice).toBe(350)
    })

    it("falls back to the current price on failure", async () => {
      post.mockRejectedValueOnce(new Error("err"))
      const result = await client.getPriceSuggestions(req)
      expect(result.suggestedPrice).toBe(300)
      expect(result.confidence).toBe(0)
      expect(result.marketData.demandLevel).toBe("medium")
    })

    it("falls back to 0 when no current price is given", async () => {
      post.mockRejectedValueOnce(new Error("err"))
      const { currentPrice, ...withoutPrice } = req
      const result = await client.getPriceSuggestions(withoutPrice as typeof req)
      expect(result.suggestedPrice).toBe(0)
    })
  })

  describe("analyzeQuery", () => {
    it("maps a full analysis response", async () => {
      post.mockResolvedValueOnce({
        data: {
          data: {
            intent: "rent",
            entities: { city: "Bangkok" },
            suggestions: ["a"],
            confidence: 0.95,
          },
        },
      })

      const result = await client.analyzeQuery("rent a scooter in bangkok")
      expect(post).toHaveBeenCalledWith("/api/content-analysis/analyze", {
        content: "rent a scooter in bangkok",
        type: "search_query",
      })
      expect(result).toEqual({
        intent: "rent",
        entities: { city: "Bangkok" },
        suggestions: ["a"],
        confidence: 0.95,
      })
    })

    it("applies defaults for missing fields in the analysis", async () => {
      post.mockResolvedValueOnce({ data: { data: {} } })
      const result = await client.analyzeQuery("hello")
      expect(result.intent).toBe("search")
      expect(result.entities).toEqual({})
      expect(result.suggestions).toEqual([])
      expect(result.confidence).toBe(0.5)
    })

    it("returns a safe default on failure", async () => {
      post.mockRejectedValueOnce(new Error("fail"))
      const result = await client.analyzeQuery("hello")
      expect(result.intent).toBe("search")
      expect(result.confidence).toBe(0)
    })
  })

  describe("generateSuggestions", () => {
    it("returns suggestions array on success", async () => {
      get.mockResolvedValueOnce({ data: { data: { suggestions: ["scooter", "scoot"] } } })
      const result = await client.generateSuggestions("scoot", { city: "BKK" })
      expect(get).toHaveBeenCalledWith("/api/ai/suggestions", {
        params: { q: "scoot", context: JSON.stringify({ city: "BKK" }) },
      })
      expect(result).toEqual(["scooter", "scoot"])
    })

    it("passes undefined context when none provided and returns [] when missing", async () => {
      get.mockResolvedValueOnce({ data: { data: {} } })
      const result = await client.generateSuggestions("scoot")
      expect(get).toHaveBeenCalledWith("/api/ai/suggestions", {
        params: { q: "scoot", context: undefined },
      })
      expect(result).toEqual([])
    })

    it("returns [] on failure", async () => {
      get.mockRejectedValueOnce(new Error("boom"))
      expect(await client.generateSuggestions("scoot")).toEqual([])
    })
  })

  describe("checkHealth", () => {
    it("returns true when the service reports healthy", async () => {
      get.mockResolvedValueOnce({ data: { status: "healthy" } })
      expect(await client.checkHealth()).toBe(true)
      expect(get).toHaveBeenCalledWith("/health")
    })

    it("returns false when the service reports a non-healthy status", async () => {
      get.mockResolvedValueOnce({ data: { status: "degraded" } })
      expect(await client.checkHealth()).toBe(false)
    })

    it("returns false when the health check throws", async () => {
      get.mockRejectedValueOnce(new Error("unreachable"))
      expect(await client.checkHealth()).toBe(false)
    })
  })
})
