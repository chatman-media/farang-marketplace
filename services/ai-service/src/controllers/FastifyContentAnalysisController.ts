import { FastifyRequest, FastifyReply } from "fastify"
import { ContentAnalysisService } from "../services/ContentAnalysisService"
import { z } from "zod"

// Zod schemas for validation
export const analyzeContentSchema = {
  body: z.object({
    type: z.enum(["listing", "review", "message", "profile"]),
    content: z.object({
      title: z.string().min(1).max(500).optional(),
      description: z.string().min(1).max(5000).optional(),
      text: z.string().min(1).max(10000).optional(),
    }),
    language: z.string().min(2).max(5).optional(),
    options: z
      .object({
        sentiment: z.boolean().default(true),
        keywords: z.boolean().default(true),
        categories: z.boolean().default(true),
        language: z.boolean().default(true),
        moderation: z.boolean().default(true),
        quality: z.boolean().default(true),
      })
      .optional(),
  }),
}

export const batchAnalyzeSchema = {
  body: z.object({
    items: z
      .array(
        z.object({
          type: z.enum(["listing", "review", "message", "profile"]),
          content: z.object({
            title: z.string().min(1).max(500).optional(),
            description: z.string().min(1).max(5000).optional(),
            text: z.string().min(1).max(10000).optional(),
          }),
          language: z.string().min(2).max(5).optional(),
        }),
      )
      .min(1)
      .max(50),
  }),
}

export const sentimentAnalysisSchema = {
  body: z.object({
    text: z.string().min(1).max(10000),
    type: z.enum(["listing", "review", "message", "profile"]).optional(),
    language: z.string().min(2).max(5).optional(),
  }),
}

export const keywordExtractionSchema = {
  body: z.object({
    text: z.string().min(1).max(10000),
    type: z.enum(["listing", "review", "message", "profile"]).optional(),
    language: z.string().min(2).max(5).optional(),
  }),
}

export const categorizationSchema = {
  body: z.object({
    type: z.enum(["listing", "review", "message", "profile"]),
    content: z.object({
      title: z.string().min(1).max(500).optional(),
      description: z.string().min(1).max(5000).optional(),
      text: z.string().min(1).max(10000).optional(),
    }),
    language: z.string().min(2).max(5).optional(),
  }),
}

export const moderationSchema = {
  body: z.object({
    text: z.string().min(1).max(10000),
    type: z.enum(["listing", "review", "message", "profile"]).optional(),
    language: z.string().min(2).max(5).optional(),
  }),
}

export const qualityAssessmentSchema = {
  body: z.object({
    type: z.enum(["listing", "review", "message", "profile"]),
    content: z.object({
      title: z.string().min(1).max(500).optional(),
      description: z.string().min(1).max(5000).optional(),
      text: z.string().min(1).max(10000).optional(),
    }),
    language: z.string().min(2).max(5).optional(),
  }),
}

export const languageDetectionSchema = {
  body: z.object({
    text: z.string().min(1).max(10000),
    type: z.enum(["listing", "review", "message", "profile"]).optional(),
  }),
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    role: "guest" | "host" | "admin"
    verified: boolean
  }
}

export class FastifyContentAnalysisController {
  private contentAnalysisService: ContentAnalysisService

  constructor(contentAnalysisService: ContentAnalysisService) {
    this.contentAnalysisService = contentAnalysisService
  }

  /**
   * Analyze single content item
   */
  async analyzeContent(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { type, content, language, options } = request.body as z.infer<typeof analyzeContentSchema.body>

      const analysisRequest = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content,
        language,
        options: {
          sentiment: options?.sentiment !== false,
          keywords: options?.keywords !== false,
          categories: options?.categories !== false,
          language: options?.language !== false,
          moderation: options?.moderation !== false,
          quality: options?.quality !== false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      reply.send({
        success: true,
        message: "Content analysis completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error analyzing content:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to analyze content",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Batch analyze multiple content items
   */
  async batchAnalyzeContent(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { items } = request.body as z.infer<typeof batchAnalyzeSchema.body>

      const analysisRequests = items.map((item, index) => ({
        id: `batch_analysis_${Date.now()}_${index}`,
        type: item.type,
        content: item.content,
        language: item.language,
        options: {
          sentiment: true,
          keywords: true,
          categories: true,
          language: true,
          moderation: true,
          quality: true,
        },
      }))

      const results = await this.contentAnalysisService.batchAnalyzeContent(analysisRequests)

      reply.send({
        success: true,
        message: "Batch content analysis completed successfully",
        data: results,
      })
    } catch (error) {
      request.log.error("Error in batch content analysis:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to analyze content batch",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { text, type, language } = request.body as z.infer<typeof sentimentAnalysisSchema.body>

      const result = await this.contentAnalysisService.analyzeSentiment({
        text,
        type,
        language,
      })

      reply.send({
        success: true,
        message: "Sentiment analysis completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error analyzing sentiment:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to analyze sentiment",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Extract keywords from text
   */
  async extractKeywords(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { text, type, language } = request.body as z.infer<typeof keywordExtractionSchema.body>

      const result = await this.contentAnalysisService.extractKeywords({
        text,
        type,
        language,
      })

      reply.send({
        success: true,
        message: "Keyword extraction completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error extracting keywords:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to extract keywords",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Categorize content
   */
  async categorizeContent(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { type, content, language } = request.body as z.infer<typeof categorizationSchema.body>

      const result = await this.contentAnalysisService.categorizeContent({
        type,
        content,
        language,
      })

      reply.send({
        success: true,
        message: "Content categorization completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error categorizing content:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to categorize content",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Moderate content
   */
  async moderateContent(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { text, type, language } = request.body as z.infer<typeof moderationSchema.body>

      const result = await this.contentAnalysisService.moderateContent({
        text,
        type,
        language,
      })

      reply.send({
        success: true,
        message: "Content moderation completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error moderating content:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to moderate content",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Assess content quality
   */
  async assessQuality(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { type, content, language } = request.body as z.infer<typeof qualityAssessmentSchema.body>

      const result = await this.contentAnalysisService.assessQuality({
        type,
        content,
        language,
      })

      reply.send({
        success: true,
        message: "Quality assessment completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error assessing quality:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to assess content quality",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const { text, type } = request.body as z.infer<typeof languageDetectionSchema.body>

      const result = await this.contentAnalysisService.detectLanguage({
        text,
        type,
      })

      reply.send({
        success: true,
        message: "Language detection completed successfully",
        data: result,
      })
    } catch (error) {
      request.log.error("Error detecting language:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to detect language",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  /**
   * Get analysis statistics
   */
  async getAnalysisStats(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const stats = this.contentAnalysisService.getStats()

      reply.send({
        success: true,
        message: "Analysis statistics retrieved successfully",
        data: stats,
      })
    } catch (error) {
      request.log.error("Error getting analysis stats:", error)
      reply.status(500).send({
        success: false,
        message: "Failed to get analysis statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
}
