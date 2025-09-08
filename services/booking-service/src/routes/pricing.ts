import { Router } from "express"
import { body, param, query } from "express-validator"
import { PricingController } from "../controllers/PricingController"
import { optionalAuthMiddleware } from "../middleware/auth"

const router = Router()
const pricingController = new PricingController()

// Validation rules
const bookingPriceValidation = [
  body("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("checkIn").isISO8601().withMessage("Check-in date must be a valid ISO 8601 date"),
  body("checkOut")
    .optional()
    .isISO8601()
    .withMessage("Check-out date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (value && req.body.checkIn) {
        const checkInDate = new Date(req.body.checkIn)
        const checkOutDate = new Date(value)
        if (checkOutDate <= checkInDate) {
          throw new Error("Check-out date must be after check-in date")
        }
      }
      return true
    }),
  body("guests").isInt({ min: 1, max: 20 }).withMessage("Number of guests must be between 1 and 20"),
]

const servicePriceValidation = [
  body("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("serviceType")
    .isIn(["consultation", "project", "hourly", "package", "subscription"])
    .withMessage("Invalid service type"),
  body("duration").isObject().withMessage("Duration must be an object"),
  body("duration.value").isInt({ min: 1 }).withMessage("Duration value must be a positive integer"),
  body("duration.unit").isIn(["minutes", "hours", "days", "weeks", "months"]).withMessage("Invalid duration unit"),
  body("deliveryMethod").isIn(["online", "in_person", "hybrid"]).withMessage("Invalid delivery method"),
]

const quickEstimateValidation = [
  param("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  query("type").isIn(["accommodation", "service"]).withMessage("Type must be either accommodation or service"),
  query("duration").optional().isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
]

const dynamicPricingValidation = [
  param("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("basePrice").isFloat({ min: 0 }).withMessage("Base price must be a non-negative number"),
  body("checkIn").isISO8601().withMessage("Check-in date must be a valid ISO 8601 date"),
  body("checkOut").optional().isISO8601().withMessage("Check-out date must be a valid ISO 8601 date"),
]

const pricingBreakdownValidation = [
  query("type").isIn(["accommodation", "service"]).withMessage("Type must be either accommodation or service"),
  // Dynamic validation based on type
  body().custom((value, { req }) => {
    const type = req.query?.type

    if (type === "accommodation") {
      if (!value.listingId || !value.checkIn || !value.guests) {
        throw new Error("For accommodation: listingId, checkIn, and guests are required")
      }
    } else if (type === "service") {
      if (!value.listingId || !value.serviceType || !value.duration || !value.deliveryMethod) {
        throw new Error("For service: listingId, serviceType, duration, and deliveryMethod are required")
      }
    }

    return true
  }),
]

const comparePricingValidation = [
  body("options").isArray({ min: 1, max: 10 }).withMessage("Options must be an array with 1-10 items"),
  body("options.*.listingId").isUUID().withMessage("Each option must have a valid listing ID"),
  body("options.*.type").isIn(["accommodation", "service"]).withMessage("Each option must have a valid type"),
]

// Routes

/**
 * @route   POST /api/pricing/booking
 * @desc    Calculate pricing for accommodation booking
 * @access  Public
 */
router.post("/booking", optionalAuthMiddleware, bookingPriceValidation, pricingController.calculateBookingPrice)

/**
 * @route   POST /api/pricing/service
 * @desc    Calculate pricing for service booking
 * @access  Public
 */
router.post("/service", optionalAuthMiddleware, servicePriceValidation, pricingController.calculateServicePrice)

/**
 * @route   GET /api/pricing/estimate/:listingId
 * @desc    Get quick price estimate
 * @access  Public
 */
router.get("/estimate/:listingId", optionalAuthMiddleware, quickEstimateValidation, pricingController.getQuickEstimate)

/**
 * @route   POST /api/pricing/dynamic/:listingId
 * @desc    Apply dynamic pricing adjustments
 * @access  Public
 */
router.post(
  "/dynamic/:listingId",
  optionalAuthMiddleware,
  dynamicPricingValidation,
  pricingController.applyDynamicPricing,
)

/**
 * @route   POST /api/pricing/breakdown
 * @desc    Get detailed pricing breakdown
 * @access  Public
 */
router.post("/breakdown", optionalAuthMiddleware, pricingBreakdownValidation, pricingController.getPricingBreakdown)

/**
 * @route   POST /api/pricing/compare
 * @desc    Compare pricing across multiple options
 * @access  Public
 */
router.post("/compare", optionalAuthMiddleware, comparePricingValidation, pricingController.comparePricing)

export default router
