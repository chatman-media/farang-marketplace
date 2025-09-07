import { Router } from "express"
import {
  RecommendationController,
  getRecommendationsValidation,
  updateBehaviorValidation,
  similarItemsValidation,
  trendingItemsValidation,
} from "../controllers/RecommendationController.js"
import {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  roleBasedRateLimit,
} from "../middleware/auth.js"

const router = Router()

export const createRecommendationRoutes = (recommendationController: RecommendationController) => {
  // Public routes with optional authentication
  router.get(
    "/trending",
    optionalAuth,
    trendingItemsValidation,
    recommendationController.getTrendingItems.bind(recommendationController)
  )
  router.get(
    "/similar/:itemId",
    optionalAuth,
    similarItemsValidation,
    recommendationController.getSimilarItems.bind(recommendationController)
  )

  // Protected routes - require authentication
  router.use(authenticateToken)
  router.use(roleBasedRateLimit)

  // User recommendations
  router.get(
    "/",
    getRecommendationsValidation,
    recommendationController.getRecommendations.bind(recommendationController)
  )
  router.get(
    "/categories",
    recommendationController.getPersonalizedCategories.bind(recommendationController)
  )

  // Behavior tracking
  router.post(
    "/behavior",
    updateBehaviorValidation,
    recommendationController.updateUserBehavior.bind(recommendationController)
  )

  // Admin only routes
  router.get(
    "/stats",
    requireAdmin,
    recommendationController.getRecommendationStats.bind(recommendationController)
  )

  return router
}

export default router
