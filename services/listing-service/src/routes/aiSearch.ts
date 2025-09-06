import { Router } from 'express';
import { AISearchController } from '../controllers/AISearchController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const aiSearchController = new AISearchController();

// Rate limiting for AI endpoints (more restrictive due to cost)
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 AI requests per windowMs
  message: {
    success: false,
    message: 'Too many AI requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for expensive operations
const expensiveAIRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 expensive AI requests per windowMs
  message: {
    success: false,
    message:
      'Too many expensive AI requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
});

// AI-Enhanced Search
router.post(
  '/search/enhanced',
  aiRateLimit,
  optionalAuthMiddleware,
  AISearchController.enhancedSearchValidation,
  aiSearchController.enhancedSearch.bind(aiSearchController)
);

// Query Analysis
router.post(
  '/analyze/query',
  aiRateLimit,
  optionalAuthMiddleware,
  AISearchController.queryAnalysisValidation,
  aiSearchController.analyzeQuery.bind(aiSearchController)
);

// Auto-suggestions (lighter rate limit as it's used frequently)
const suggestionsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for suggestions
  message: {
    success: false,
    message: 'Too many suggestion requests, please slow down.',
  },
});

router.get(
  '/suggestions',
  suggestionsRateLimit,
  optionalAuthMiddleware,
  AISearchController.suggestionsValidation,
  aiSearchController.getSuggestions.bind(aiSearchController)
);

// Personalized Recommendations (requires authentication)
router.post(
  '/recommendations',
  expensiveAIRateLimit,
  authMiddleware,
  AISearchController.recommendationsValidation,
  aiSearchController.getRecommendations.bind(aiSearchController)
);

// Service Matching
router.post(
  '/services/match',
  expensiveAIRateLimit,
  optionalAuthMiddleware,
  AISearchController.serviceMatchingValidation,
  aiSearchController.matchServices.bind(aiSearchController)
);

// AI Service Status (admin/monitoring endpoint)
router.get(
  '/status',
  authMiddleware, // Require auth for status info
  aiSearchController.getAIStatus.bind(aiSearchController)
);

// Cost Estimation (admin endpoint)
router.get(
  '/cost-estimate',
  authMiddleware,
  aiSearchController.getCostEstimate.bind(aiSearchController)
);

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Search service is healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-search',
    version: '1.0.0',
  });
});

export default router;
