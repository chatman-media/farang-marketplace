import { Router } from "express"
import { body, query, param } from "express-validator"
import { MarketplaceIntegrationController } from "../controllers/MarketplaceIntegrationController.js"
import { authenticateToken } from "../middleware/auth.js"

const router = Router()
const marketplaceController = new MarketplaceIntegrationController()

// Validation middleware
const bookingIntelligenceValidation = [
  body("userId").isUUID().withMessage("User ID must be a valid UUID"),
  body("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("bookingData").isObject().withMessage("Booking data must be an object"),
  body("bookingData.bookingId").optional().isUUID().withMessage("Booking ID must be a valid UUID"),
  body("bookingData.currentPrice")
    .optional()
    .isNumeric()
    .withMessage("Current price must be a number"),
  body("bookingData.checkIn")
    .optional()
    .isISO8601()
    .withMessage("Check-in date must be a valid ISO 8601 date"),
  body("bookingData.checkOut")
    .optional()
    .isISO8601()
    .withMessage("Check-out date must be a valid ISO 8601 date"),
]

const priceSuggestionsValidation = [
  body("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("currentPrice").optional().isNumeric().withMessage("Current price must be a number"),
  body("marketContext").optional().isObject().withMessage("Market context must be an object"),
]

const smartNotificationValidation = [
  body("userId").isUUID().withMessage("User ID must be a valid UUID"),
  body("type")
    .isIn(["booking_reminder", "price_alert", "recommendation", "engagement"])
    .withMessage("Type must be one of: booking_reminder, price_alert, recommendation, engagement"),
  body("context").isObject().withMessage("Context must be an object"),
  body("context.bookingId").optional().isUUID().withMessage("Booking ID must be a valid UUID"),
  body("context.listingId").optional().isUUID().withMessage("Listing ID must be a valid UUID"),
]

const fraudDetectionValidation = [
  body("userId").isUUID().withMessage("User ID must be a valid UUID"),
  body("listingId").optional().isUUID().withMessage("Listing ID must be a valid UUID"),
  body("transactionData").optional().isObject().withMessage("Transaction data must be an object"),
  body("transactionData.amount")
    .optional()
    .isNumeric()
    .withMessage("Transaction amount must be a number"),
  body("transactionData.currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-character code"),
]

const analyticsValidation = [
  query("timeframe")
    .optional()
    .isIn(["1d", "7d", "30d", "90d", "1y"])
    .withMessage("Timeframe must be one of: 1d, 7d, 30d, 90d, 1y"),
  query("category").optional().isString().withMessage("Category must be a string"),
  query("location").optional().isString().withMessage("Location must be a string"),
]

// Public routes (no authentication required)
router.get("/health", marketplaceController.healthCheck)

// Protected routes (authentication required)
router.use(authenticateToken)

// Booking Intelligence
router.post(
  "/booking-intelligence",
  bookingIntelligenceValidation,
  marketplaceController.generateBookingIntelligence
)

// Price Suggestions
router.post(
  "/price-suggestions",
  priceSuggestionsValidation,
  marketplaceController.generatePriceSuggestions
)

// Smart Notifications
router.post(
  "/smart-notifications",
  smartNotificationValidation,
  marketplaceController.createSmartNotification
)

// Fraud Detection
router.post("/fraud-detection", fraudDetectionValidation, marketplaceController.detectFraud)

// Analytics (admin/moderator only)
router.get("/analytics", analyticsValidation, marketplaceController.getMarketplaceAnalytics)

export default router
