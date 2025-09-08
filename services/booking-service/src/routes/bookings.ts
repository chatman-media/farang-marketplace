import { Router } from "express"
import { body, param, query } from "express-validator"
import { BookingController } from "../controllers/BookingController"
import { authMiddleware } from "../middleware/auth"

const router = Router()
const bookingController = new BookingController()

// Validation rules
const createBookingValidation = [
  body("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("checkIn")
    .isISO8601()
    .withMessage("Check-in date must be a valid ISO 8601 date")
    .custom((value) => {
      const checkInDate = new Date(value)
      const now = new Date()
      if (checkInDate <= now) {
        throw new Error("Check-in date must be in the future")
      }
      return true
    }),
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
  body("specialRequests")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Special requests must not exceed 1000 characters"),
]

const createServiceBookingValidation = [
  body("listingId").isUUID().withMessage("Listing ID must be a valid UUID"),
  body("serviceType")
    .isIn(["consultation", "project", "hourly", "package", "subscription"])
    .withMessage("Invalid service type"),
  body("scheduledDate")
    .isISO8601()
    .withMessage("Scheduled date must be a valid ISO 8601 date")
    .custom((value) => {
      const scheduledDate = new Date(value)
      const now = new Date()
      if (scheduledDate <= now) {
        throw new Error("Scheduled date must be in the future")
      }
      return true
    }),
  body("scheduledTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Scheduled time must be in HH:MM format"),
  body("duration").isObject().withMessage("Duration must be an object"),
  body("duration.value").isInt({ min: 1 }).withMessage("Duration value must be a positive integer"),
  body("duration.unit").isIn(["minutes", "hours", "days", "weeks", "months"]).withMessage("Invalid duration unit"),
  body("deliveryMethod").isIn(["online", "in_person", "hybrid"]).withMessage("Invalid delivery method"),
  body("requirements").optional().isArray().withMessage("Requirements must be an array"),
  body("deliverables").optional().isArray().withMessage("Deliverables must be an array"),
  body("communicationPreference")
    .isIn(["email", "phone", "chat", "video_call"])
    .withMessage("Invalid communication preference"),
  body("timezone").optional().isLength({ min: 1, max: 50 }).withMessage("Timezone must be between 1 and 50 characters"),
]

const updateStatusValidation = [
  param("bookingId").isUUID().withMessage("Booking ID must be a valid UUID"),
  body("status")
    .isIn(["pending", "confirmed", "active", "completed", "cancelled", "disputed"])
    .withMessage("Invalid booking status"),
  body("reason").optional().isLength({ max: 500 }).withMessage("Reason must not exceed 500 characters"),
]

const bookingIdValidation = [param("bookingId").isUUID().withMessage("Booking ID must be a valid UUID")]

const searchValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["pending", "confirmed", "active", "completed", "cancelled", "disputed"])
    .withMessage("Invalid status filter"),
  query("type")
    .optional()
    .isIn(["accommodation", "transportation", "tour", "activity", "dining", "event", "service"])
    .withMessage("Invalid type filter"),
  query("paymentStatus")
    .optional()
    .isIn(["pending", "processing", "completed", "failed", "refunded", "partially_refunded"])
    .withMessage("Invalid payment status filter"),
  query("guestId").optional().isUUID().withMessage("Guest ID must be a valid UUID"),
  query("hostId").optional().isUUID().withMessage("Host ID must be a valid UUID"),
  query("startDate").optional().isISO8601().withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("Minimum price must be a non-negative number"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("Maximum price must be a non-negative number"),
]

// Routes

/**
 * @route   POST /api/bookings
 * @desc    Create a new accommodation booking
 * @access  Private (authenticated users)
 */
router.post("/", authMiddleware, createBookingValidation, bookingController.createBooking)

/**
 * @route   POST /api/bookings/service
 * @desc    Create a new service booking
 * @access  Private (authenticated users)
 */
router.post("/service", authMiddleware, createServiceBookingValidation, bookingController.createServiceBooking)

/**
 * @route   GET /api/bookings/search
 * @desc    Search bookings with filters
 * @access  Private (authenticated users)
 */
router.get("/search", authMiddleware, searchValidation, bookingController.searchBookings)

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking by ID
 * @access  Private (booking participants only)
 */
router.get("/:bookingId", authMiddleware, bookingIdValidation, bookingController.getBooking)

/**
 * @route   GET /api/bookings/:bookingId/service
 * @desc    Get service booking details by ID
 * @access  Private (booking participants only)
 */
router.get("/:bookingId/service", authMiddleware, bookingIdValidation, bookingController.getServiceBooking)

/**
 * @route   PATCH /api/bookings/:bookingId/status
 * @desc    Update booking status
 * @access  Private (booking participants only)
 */
router.patch("/:bookingId/status", authMiddleware, updateStatusValidation, bookingController.updateBookingStatus)

/**
 * @route   GET /api/bookings/:bookingId/history
 * @desc    Get booking status history
 * @access  Private (booking participants only)
 */
router.get("/:bookingId/history", authMiddleware, bookingIdValidation, bookingController.getBookingStatusHistory)

export default router
