import { Response } from "express"
import { body, validationResult } from "express-validator"
import { ContentAnalysisService } from "../services/ContentAnalysisService"
import type { AuthenticatedRequest } from "../middleware/auth"

export class ContentAnalysisController {
  private contentAnalysisService: ContentAnalysisService

  constructor(contentAnalysisService: ContentAnalysisService) {
    this.contentAnalysisService = contentAnalysisService
  }

  /**
   * Analyze single content item
   */
  async analyzeContent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: req.body.type,
        content: req.body.content,
        language: req.body.language,
        options: {
          sentiment: req.body.options?.sentiment !== false,
          keywords: req.body.options?.keywords !== false,
          categories: req.body.options?.categories !== false,
          language: req.body.options?.language !== false,
          moderation: req.body.options?.moderation !== false,
          quality: req.body.options?.quality !== false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Content analysis completed successfully",
        data: result,
      })
    } catch (error) {
      console.error("Error analyzing content:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze content",
      })
    }
  }

  /**
   * Analyze multiple content items in batch
   */
  async batchAnalyzeContent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const requests = req.body.items.map((item: any, index: number) => ({
        id: item.id || `batch_${Date.now()}_${index}`,
        type: item.type,
        content: item.content,
        language: item.language,
        options: {
          sentiment: item.options?.sentiment !== false,
          keywords: item.options?.keywords !== false,
          categories: item.options?.categories !== false,
          language: item.options?.language !== false,
          moderation: item.options?.moderation !== false,
          quality: item.options?.quality !== false,
        },
      }))

      const results = await this.contentAnalysisService.batchAnalyze(requests)

      res.json({
        success: true,
        message: `Analyzed ${results.length} content items`,
        data: {
          results,
          totalItems: requests.length,
          successfulAnalyses: results.filter((r) => r.sentiment || r.keywords || r.categories)
            .length,
        },
      })
    } catch (error) {
      console.error("Error in batch content analysis:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze content batch",
      })
    }
  }

  /**
   * Analyze sentiment only
   */
  async analyzeSentiment(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `sentiment_${Date.now()}`,
        type: req.body.type || "text",
        content: {
          text: req.body.text,
        },
        language: req.body.language,
        options: {
          sentiment: true,
          keywords: false,
          categories: false,
          language: false,
          moderation: false,
          quality: false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Sentiment analysis completed",
        data: {
          id: result.id,
          sentiment: result.sentiment,
          processingTime: result.processingTime,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze sentiment",
      })
    }
  }

  /**
   * Extract keywords only
   */
  async extractKeywords(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `keywords_${Date.now()}`,
        type: req.body.type || "text",
        content: {
          text: req.body.text,
        },
        language: req.body.language,
        options: {
          sentiment: false,
          keywords: true,
          categories: false,
          language: false,
          moderation: false,
          quality: false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Keyword extraction completed",
        data: {
          id: result.id,
          keywords: result.keywords,
          processingTime: result.processingTime,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error("Error extracting keywords:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to extract keywords",
      })
    }
  }

  /**
   * Categorize content
   */
  async categorizeContent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `categories_${Date.now()}`,
        type: req.body.type,
        content: req.body.content,
        language: req.body.language,
        options: {
          sentiment: false,
          keywords: false,
          categories: true,
          language: false,
          moderation: false,
          quality: false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Content categorization completed",
        data: {
          id: result.id,
          categories: result.categories,
          processingTime: result.processingTime,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error("Error categorizing content:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to categorize content",
      })
    }
  }

  /**
   * Moderate content for inappropriate material
   */
  async moderateContent(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `moderation_${Date.now()}`,
        type: req.body.type || "text",
        content: {
          text: req.body.text,
        },
        language: req.body.language,
        options: {
          sentiment: false,
          keywords: false,
          categories: false,
          language: false,
          moderation: true,
          quality: false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Content moderation completed",
        data: {
          id: result.id,
          moderation: result.moderation,
          processingTime: result.processingTime,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error("Error moderating content:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to moderate content",
      })
    }
  }

  /**
   * Assess content quality
   */
  async assessQuality(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `quality_${Date.now()}`,
        type: req.body.type,
        content: req.body.content,
        language: req.body.language,
        options: {
          sentiment: false,
          keywords: false,
          categories: false,
          language: false,
          moderation: false,
          quality: true,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Quality assessment completed",
        data: {
          id: result.id,
          quality: result.quality,
          processingTime: result.processingTime,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error("Error assessing quality:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to assess content quality",
      })
    }
  }

  /**
   * Detect content language
   */
  async detectLanguage(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const analysisRequest = {
        id: `language_${Date.now()}`,
        type: req.body.type || "text",
        content: {
          text: req.body.text,
        },
        options: {
          sentiment: false,
          keywords: false,
          categories: false,
          language: true,
          moderation: false,
          quality: false,
        },
      }

      const result = await this.contentAnalysisService.analyzeContent(analysisRequest)

      res.json({
        success: true,
        message: "Language detection completed",
        data: {
          id: result.id,
          language: result.language,
          processingTime: result.processingTime,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error("Error detecting language:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to detect language",
      })
    }
  }

  /**
   * Get content analysis statistics
   */
  async getAnalysisStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const stats = this.contentAnalysisService.getStats()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error("Error getting analysis stats:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get analysis statistics",
      })
    }
  }
}

// Validation rules
export const analyzeContentValidation = [
  body("type")
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("content").isObject().withMessage("Content object is required"),
  body("content.title")
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage("Title must be 1-500 characters"),
  body("content.description")
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Description must be 1-5000 characters"),
  body("content.text")
    .optional()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Text must be 1-10000 characters"),
  body("language")
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),
]

export const batchAnalyzeValidation = [
  body("items").isArray({ min: 1, max: 50 }).withMessage("Items array must contain 1-50 items"),
  body("items.*.type")
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("items.*.content").isObject().withMessage("Content object is required"),
]

export const sentimentAnalysisValidation = [
  body("text").isLength({ min: 1, max: 10000 }).withMessage("Text must be 1-10000 characters"),
  body("type")
    .optional()
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("language")
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),
]

export const keywordExtractionValidation = [
  body("text").isLength({ min: 1, max: 10000 }).withMessage("Text must be 1-10000 characters"),
  body("type")
    .optional()
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("language")
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),
]

export const categorizationValidation = [
  body("type")
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("content").isObject().withMessage("Content object is required"),
  body("language")
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),
]

export const moderationValidation = [
  body("text").isLength({ min: 1, max: 10000 }).withMessage("Text must be 1-10000 characters"),
  body("type")
    .optional()
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("language")
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),
]

export const qualityAssessmentValidation = [
  body("type")
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
  body("content").isObject().withMessage("Content object is required"),
  body("language")
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),
]

export const languageDetectionValidation = [
  body("text").isLength({ min: 1, max: 10000 }).withMessage("Text must be 1-10000 characters"),
  body("type")
    .optional()
    .isIn(["listing", "review", "message", "profile"])
    .withMessage("Invalid content type"),
]
