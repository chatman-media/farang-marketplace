import { FastifyPluginAsync } from "fastify"
import {
  ContentAnalysisController,
  analyzeContentSchema,
  batchAnalyzeSchema,
  sentimentAnalysisSchema,
  keywordExtractionSchema,
  categorizationSchema,
  moderationSchema,
  qualityAssessmentSchema,
  languageDetectionSchema,
} from "../controllers/ContentAnalysisController"

interface ContentAnalysisRouteOptions {
  contentAnalysisController: ContentAnalysisController
}

const contentAnalysisRoutes: FastifyPluginAsync<ContentAnalysisRouteOptions> = async (fastify, options) => {
  const { contentAnalysisController } = options

  // All routes require authentication (middleware temporarily disabled)
  // fastify.addHook("preHandler", fastify.authenticate)
  // fastify.addHook("preHandler", fastify.roleBasedRateLimit)

  // Content analysis routes
  fastify.post("/analyze", {
    schema: analyzeContentSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.analyzeContent.bind(contentAnalysisController),
  })

  fastify.post("/batch-analyze", {
    schema: batchAnalyzeSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.batchAnalyzeContent.bind(contentAnalysisController),
  })

  // Specific analysis endpoints
  fastify.post("/sentiment", {
    schema: sentimentAnalysisSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.analyzeSentiment.bind(contentAnalysisController),
  })

  fastify.post("/keywords", {
    schema: keywordExtractionSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.extractKeywords.bind(contentAnalysisController),
  })

  fastify.post("/categorize", {
    schema: categorizationSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.categorizeContent.bind(contentAnalysisController),
  })

  fastify.post("/moderate", {
    schema: moderationSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.moderateContent.bind(contentAnalysisController),
  })

  fastify.post("/quality", {
    schema: qualityAssessmentSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.assessQuality.bind(contentAnalysisController),
  })

  fastify.post("/language", {
    schema: languageDetectionSchema,
    // preHandler: [fastify.authenticate, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.detectLanguage.bind(contentAnalysisController),
  })

  // Admin only routes
  fastify.get("/stats", {
    // preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.roleBasedRateLimit],
    handler: contentAnalysisController.getAnalysisStats.bind(contentAnalysisController),
  })
}

export default contentAnalysisRoutes
