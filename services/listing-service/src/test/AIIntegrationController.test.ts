import type { FastifyReply, FastifyRequest } from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock the aiClient singleton so we can drive both success and the non-Zod error
// (500) branches of the controller, which the existing app-level AI tests (which
// only hit the fallback path) don't cover.
const { aiClient } = vi.hoisted(() => ({
  aiClient: {
    enhanceSearch: vi.fn(),
    analyzeQuery: vi.fn(),
    getRecommendations: vi.fn(),
    getPriceSuggestions: vi.fn(),
    generateSuggestions: vi.fn(),
    checkHealth: vi.fn(),
  },
}))

vi.mock("../services/AIClient", () => ({ aiClient }))

import { AIIntegrationController } from "../controllers/AIIntegrationController"

function makeReply() {
  const reply = {
    statusCode: 200 as number,
    payload: undefined as any,
    code: vi.fn(function (this: any, c: number) {
      this.statusCode = c
      return this
    }),
    send: vi.fn(function (this: any, p: any) {
      this.payload = p
      return this
    }),
  }
  return reply as unknown as FastifyReply & {
    statusCode: number
    payload: any
    code: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

const req = (parts: Partial<FastifyRequest>) => parts as FastifyRequest

describe("AIIntegrationController", () => {
  let controller: AIIntegrationController

  beforeEach(() => {
    controller = new AIIntegrationController()
    for (const fn of Object.values(aiClient)) (fn as ReturnType<typeof vi.fn>).mockReset()
  })

  afterEach(() => vi.clearAllMocks())

  describe("enhancedSearch", () => {
    it("returns data on success", async () => {
      aiClient.enhanceSearch.mockResolvedValue({ enhancedQuery: "q" })
      const reply = makeReply()
      await controller.enhancedSearch(req({ body: { query: "scooter" } }), reply)
      expect(reply.payload.success).toBe(true)
      expect(reply.payload.data).toEqual({ enhancedQuery: "q" })
    })

    it("returns 400 on validation error (empty query)", async () => {
      const reply = makeReply()
      await controller.enhancedSearch(req({ body: { query: "" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
      expect(reply.payload.message).toBe("Validation Error")
    })

    it("returns 500 when the client throws a non-validation error", async () => {
      aiClient.enhanceSearch.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.enhancedSearch(req({ body: { query: "scooter" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to perform enhanced search")
    })
  })

  describe("analyzeQuery", () => {
    it("returns analysis on success", async () => {
      aiClient.analyzeQuery.mockResolvedValue({ intent: "rent" })
      const reply = makeReply()
      await controller.analyzeQuery(req({ body: { query: "rent a scooter" } }), reply)
      expect(reply.payload.data).toEqual({ intent: "rent" })
    })

    it("returns 400 on missing query", async () => {
      const reply = makeReply()
      await controller.analyzeQuery(req({ body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 500 on client error", async () => {
      aiClient.analyzeQuery.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.analyzeQuery(req({ body: { query: "x" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to analyze query")
    })
  })

  describe("getRecommendations", () => {
    it("returns recommendations on success", async () => {
      aiClient.getRecommendations.mockResolvedValue({ recommendations: [] })
      const reply = makeReply()
      await controller.getRecommendations(req({ body: { userId: "u1" } }), reply)
      expect(reply.payload.success).toBe(true)
    })

    it("returns 400 when userId is missing", async () => {
      const reply = makeReply()
      await controller.getRecommendations(req({ body: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 500 on client error", async () => {
      aiClient.getRecommendations.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.getRecommendations(req({ body: { userId: "u1" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to get recommendations")
    })
  })

  describe("getPriceSuggestions", () => {
    const validBody = {
      listingId: "l1",
      category: "vehicle",
      location: { city: "Bangkok", region: "Bangkok", country: "TH" },
      features: { type: "scooter" },
    }

    it("returns suggestions on success", async () => {
      aiClient.getPriceSuggestions.mockResolvedValue({ suggestedPrice: 350 })
      const reply = makeReply()
      await controller.getPriceSuggestions(req({ body: validBody }), reply)
      expect(reply.payload.data.suggestedPrice).toBe(350)
    })

    it("returns 400 on invalid body (missing location)", async () => {
      const reply = makeReply()
      await controller.getPriceSuggestions(req({ body: { listingId: "l1", category: "v", features: {} } }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 500 on client error", async () => {
      aiClient.getPriceSuggestions.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.getPriceSuggestions(req({ body: validBody }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to get price suggestions")
    })
  })

  describe("getSuggestions", () => {
    it("returns suggestions on success and parses context", async () => {
      aiClient.generateSuggestions.mockResolvedValue(["scooter"])
      const reply = makeReply()
      await controller.getSuggestions(req({ query: { q: "scoot", context: '{"city":"BKK"}' } }), reply)
      expect(reply.payload.data.suggestions).toEqual(["scooter"])
      expect(aiClient.generateSuggestions).toHaveBeenCalledWith("scoot", { city: "BKK" })
    })

    it("returns 400 when q is missing", async () => {
      const reply = makeReply()
      await controller.getSuggestions(req({ query: {} }), reply)
      expect(reply.code).toHaveBeenCalledWith(400)
    })

    it("returns 500 when context JSON is malformed (JSON.parse throws)", async () => {
      const reply = makeReply()
      await controller.getSuggestions(req({ query: { q: "scoot", context: "{not-json" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to get suggestions")
    })

    it("returns 500 on client error", async () => {
      aiClient.generateSuggestions.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.getSuggestions(req({ query: { q: "scoot" } }), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAIStatus", () => {
    it("reports healthy when the client is healthy", async () => {
      aiClient.checkHealth.mockResolvedValue(true)
      const reply = makeReply()
      await controller.getAIStatus(req({}), reply)
      expect(reply.payload.data.status).toBe("healthy")
    })

    it("reports unhealthy when the client is not healthy", async () => {
      aiClient.checkHealth.mockResolvedValue(false)
      const reply = makeReply()
      await controller.getAIStatus(req({}), reply)
      expect(reply.payload.data.status).toBe("unhealthy")
    })

    it("returns 500 when the health check throws", async () => {
      aiClient.checkHealth.mockRejectedValue(new Error("boom"))
      const reply = makeReply()
      await controller.getAIStatus(req({}), reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.payload.message).toBe("Failed to get AI status")
    })
  })
})
