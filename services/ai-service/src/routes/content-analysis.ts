import { Router } from "express"
import {
  ContentAnalysisController,
  analyzeContentValidation,
  batchAnalyzeValidation,
  sentimentAnalysisValidation,
  keywordExtractionValidation,
  categorizationValidation,
  moderationValidation,
  qualityAssessmentValidation,
  languageDetectionValidation,
} from "../controllers/ContentAnalysisController"
import { authenticateToken, requireAdmin, roleBasedRateLimit } from "../middleware/auth"

const router = Router()

export const createContentAnalysisRoutes = (contentAnalysisController: ContentAnalysisController) => {
  // All routes require authentication
  router.use(authenticateToken)
  router.use(roleBasedRateLimit)

  // Content analysis routes
  router.post(
    "/analyze",
    analyzeContentValidation,
    contentAnalysisController.analyzeContent.bind(contentAnalysisController),
  )
  router.post(
    "/batch-analyze",
    batchAnalyzeValidation,
    contentAnalysisController.batchAnalyzeContent.bind(contentAnalysisController),
  )

  // Specific analysis endpoints
  router.post(
    "/sentiment",
    sentimentAnalysisValidation,
    contentAnalysisController.analyzeSentiment.bind(contentAnalysisController),
  )
  router.post(
    "/keywords",
    keywordExtractionValidation,
    contentAnalysisController.extractKeywords.bind(contentAnalysisController),
  )
  router.post(
    "/categorize",
    categorizationValidation,
    contentAnalysisController.categorizeContent.bind(contentAnalysisController),
  )
  router.post(
    "/moderate",
    moderationValidation,
    contentAnalysisController.moderateContent.bind(contentAnalysisController),
  )
  router.post(
    "/quality",
    qualityAssessmentValidation,
    contentAnalysisController.assessQuality.bind(contentAnalysisController),
  )
  router.post(
    "/language",
    languageDetectionValidation,
    contentAnalysisController.detectLanguage.bind(contentAnalysisController),
  )

  // Admin only routes
  router.get("/stats", requireAdmin, contentAnalysisController.getAnalysisStats.bind(contentAnalysisController))

  return router
}

export default router
