import { beforeEach, describe, expect, it } from "vitest"

import { AIProviderService } from "../services/AIProviderService"
import { ContentAnalysisService } from "../services/ContentAnalysisService"

describe("Content Analysis Service Tests", () => {
  let contentAnalysisService: ContentAnalysisService
  let aiProviderService: AIProviderService

  beforeEach(() => {
    aiProviderService = new AIProviderService()
    contentAnalysisService = new ContentAnalysisService(aiProviderService)
  })

  describe("Keyword Extraction with Compromise", () => {
    it("should extract keywords using compromise NLP", async () => {
      const text = "This amazing smartphone has excellent camera quality and fast processor performance"
      const keywords = await contentAnalysisService.extractKeywords(text, "en")

      expect(keywords).toBeDefined()
      expect(Array.isArray(keywords)).toBe(true)
      expect(keywords.length).toBeGreaterThan(0)

      // Should extract nouns like 'smartphone', 'camera', 'processor'
      const keywordWords = keywords.map((k) => k.word)
      expect(keywordWords.some((word) => ["smartphone", "camera", "processor"].includes(word))).toBe(true)

      // Should have categories for different types of words
      const categorizedKeywords = keywords.filter((k) => k.category)
      expect(categorizedKeywords.length).toBeGreaterThan(0)
    })

    it("should extract entities using compromise", async () => {
      const text = "Apple iPhone 15 Pro available in Bangkok, Thailand. Contact John Smith for details."
      const keywords = await contentAnalysisService.extractKeywords(text, "en")

      expect(keywords).toBeDefined()
      const keywordWords = keywords.map((k) => k.word)

      // Should extract places
      expect(keywordWords.some((word) => ["bangkok", "thailand"].includes(word))).toBe(true)

      // Should extract organizations/products
      expect(keywordWords.some((word) => ["apple", "iphone"].includes(word))).toBe(true)
    })

    it("should handle empty text gracefully", async () => {
      const keywords = await contentAnalysisService.extractKeywords("", "en")
      expect(keywords).toBeDefined()
      expect(Array.isArray(keywords)).toBe(true)
      expect(keywords.length).toBe(0)
    })
  })

  describe("Content Categorization with Compromise", () => {
    it("should categorize electronics content using enhanced matching", async () => {
      const request = {
        id: "test-1",
        type: "listing" as const,
        content: {
          title: "Latest Gaming Laptop",
          description: "High-performance laptop with NVIDIA graphics card, Intel processor, and RGB keyboard",
        },
        language: "en",
        options: {
          categories: true,
          keywords: false,
          sentiment: false,
          moderation: false,
          quality: false,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.categories).toBeDefined()
      expect(result.categories!.length).toBeGreaterThan(0)

      // Should categorize as electronics
      const electronicsCategory = result.categories!.find((c) => c.category === "electronics")
      expect(electronicsCategory).toBeDefined()
      expect(electronicsCategory!.confidence).toBeGreaterThan(0.2)
    })

    it("should categorize fashion content correctly", async () => {
      const request = {
        id: "test-2",
        type: "listing" as const,
        content: {
          title: "Designer Dress",
          description: "Beautiful evening dress made from silk fabric with elegant design",
        },
        language: "en",
        options: {
          categories: true,
          keywords: false,
          sentiment: false,
          moderation: false,
          quality: false,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.categories).toBeDefined()
      const fashionCategory = result.categories!.find((c) => c.category === "fashion")
      expect(fashionCategory).toBeDefined()
      expect(fashionCategory!.confidence).toBeGreaterThan(0.2)
    })
  })

  describe("Quality Assessment with Compromise", () => {
    it("should assess content quality using compromise grammar analysis", async () => {
      const request = {
        id: "test-3",
        type: "listing" as const,
        content: {
          title: "Professional Camera Equipment",
          description:
            "High-quality DSLR camera with multiple lenses. Perfect for professional photography. Includes tripod and carrying case. Excellent condition with minimal usage.",
        },
        language: "en",
        options: {
          categories: false,
          keywords: false,
          sentiment: false,
          moderation: false,
          quality: true,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.quality).toBeDefined()
      expect(result.quality!.score).toBeGreaterThan(0.5)
      expect(Array.isArray(result.quality!.issues)).toBe(true)
      expect(Array.isArray(result.quality!.suggestions)).toBe(true)
    })

    it("should detect grammar issues using compromise", async () => {
      const request = {
        id: "test-4",
        type: "listing" as const,
        content: {
          title: "BAD TITLE ALL CAPS",
          description:
            "this this is bad grammar. VERY VERY LONG SENTENCE WITH TOO MANY WORDS AND NO PROPER STRUCTURE THAT GOES ON AND ON WITHOUT MAKING MUCH SENSE OR HAVING PROPER PUNCTUATION OR BREAKS. short.",
        },
        language: "en",
        options: {
          categories: false,
          keywords: false,
          sentiment: false,
          moderation: false,
          quality: true,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.quality).toBeDefined()
      expect(result.quality!.score).toBeLessThan(0.8) // Should detect issues
      expect(result.quality!.issues.length).toBeGreaterThan(0)
    })
  })

  describe("Sentiment Analysis", () => {
    it("should analyze positive sentiment", async () => {
      const request = {
        id: "test-5",
        type: "review" as const,
        content: {
          text: "This product is absolutely amazing! I love it so much. Excellent quality and fast delivery.",
        },
        language: "en",
        options: {
          categories: false,
          keywords: false,
          sentiment: true,
          moderation: false,
          quality: false,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.sentiment).toBeDefined()
      expect(result.sentiment!.score).toBeGreaterThan(0.5)
      expect(result.sentiment!.label).toBe("positive")
    })

    it("should analyze negative sentiment", async () => {
      const request = {
        id: "test-6",
        type: "review" as const,
        content: {
          text: "Terrible product. Poor quality and awful customer service. I hate it.",
        },
        language: "en",
        options: {
          categories: false,
          keywords: false,
          sentiment: true,
          moderation: false,
          quality: false,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.sentiment).toBeDefined()
      expect(result.sentiment!.score).toBeLessThan(-0.3)
      expect(result.sentiment!.label).toBe("negative")
    })
  })

  describe("Language Detection", () => {
    it("should detect English language", async () => {
      const request = {
        id: "test-7",
        type: "listing" as const,
        content: {
          title: "English Product Title",
          description: "This is a description written in English language with proper grammar and vocabulary.",
        },
        language: "auto",
        options: {
          categories: false,
          keywords: false,
          sentiment: false,
          moderation: false,
          quality: false,
          language: true,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.language).toBeDefined()
      expect(result.language!.detected).toBe("en")
      expect(result.language!.confidence).toBeGreaterThan(0.8)
    })

    it("should handle mixed content", async () => {
      const request = {
        id: "test-8",
        type: "listing" as const,
        content: {
          title: "Mixed Language สินค้าดี",
          description: "This product is good. สินค้านี้ดีมาก. Very nice quality.",
        },
        language: "auto",
        options: {
          categories: false,
          keywords: false,
          sentiment: false,
          moderation: false,
          quality: false,
          language: true,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      expect(result.language).toBeDefined()
      expect(["en", "th", "mixed"]).toContain(result.language!.detected)
    })
  })

  describe("Comprehensive Analysis", () => {
    it("should perform complete content analysis", async () => {
      const request = {
        id: "test-9",
        type: "listing" as const,
        content: {
          title: "Premium Wireless Headphones",
          description:
            "Experience exceptional audio quality with these premium wireless headphones. Features noise cancellation, long battery life, and comfortable design. Perfect for music lovers and professionals.",
        },
        language: "en",
        options: {
          categories: true,
          keywords: true,
          sentiment: true,
          moderation: true,
          quality: true,
          language: true,
        },
      }

      const result = await contentAnalysisService.analyzeContent(request)

      // All analysis types should be present
      expect(result.categories).toBeDefined()
      expect(result.keywords).toBeDefined()
      expect(result.sentiment).toBeDefined()
      expect(result.moderation).toBeDefined()
      expect(result.quality).toBeDefined()
      expect(result.language).toBeDefined()

      // Should have reasonable results
      expect(result.categories!.length).toBeGreaterThan(0)
      expect(result.keywords!.length).toBeGreaterThan(0)
      expect(result.sentiment!.score).toBeGreaterThan(0) // Positive description
      expect(result.quality!.score).toBeGreaterThan(0.6) // Good quality content
    })
  })
})
