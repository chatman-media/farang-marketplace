import { Router } from "express"
import {
  InsightsController,
  trackBehaviorValidation,
  userInsightsValidation,
  marketInsightsValidation,
  behaviorTrendsValidation,
} from "../controllers/InsightsController.js"
import {
  authenticateToken,
  requireAdmin,
  requireResourceAccess,
  roleBasedRateLimit,
} from "../middleware/auth.js"

const router = Router()

export const createInsightsRoutes = (insightsController: InsightsController) => {
  // All routes require authentication
  router.use(authenticateToken)
  router.use(roleBasedRateLimit)

  // Behavior tracking
  router.post(
    "/behavior",
    trackBehaviorValidation,
    insightsController.trackBehavior.bind(insightsController)
  )

  // User insights
  router.get(
    "/user/:userId",
    userInsightsValidation,
    requireResourceAccess("user"),
    insightsController.getUserInsights.bind(insightsController)
  )
  router.post(
    "/user/:userId/analyze",
    userInsightsValidation,
    requireResourceAccess("user"),
    insightsController.analyzeUserBehavior.bind(insightsController)
  )

  // Behavior statistics
  router.get("/behavior/stats", insightsController.getBehaviorStats.bind(insightsController))

  // Admin only routes
  router.get(
    "/market",
    requireAdmin,
    marketInsightsValidation,
    insightsController.getMarketInsights.bind(insightsController)
  )
  router.post(
    "/market/generate",
    requireAdmin,
    insightsController.generateMarketInsights.bind(insightsController)
  )
  router.get("/segments", requireAdmin, insightsController.getUserSegments.bind(insightsController))
  router.get(
    "/trends",
    requireAdmin,
    behaviorTrendsValidation,
    insightsController.getBehaviorTrends.bind(insightsController)
  )

  return router
}

export default router
