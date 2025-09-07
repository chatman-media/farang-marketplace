import { Router } from "express"
import {
  BookingIntegrationController,
  findMatchingAgenciesValidation,
  assignServiceValidation,
  calculateCommissionValidation,
  assignmentIdValidation,
} from "../controllers/BookingIntegrationController.js"
import { authenticateToken, requireAgencyStaff, optionalAuth } from "../middleware/auth.js"

const router = Router()
const bookingIntegrationController = new BookingIntegrationController()

// Public routes
router.get(
  "/categories",
  optionalAuth,
  bookingIntegrationController.getServiceCategories.bind(bookingIntegrationController)
)

// Protected routes - require authentication
router.use(authenticateToken)

// Booking integration routes
router.post(
  "/find-matches",
  findMatchingAgenciesValidation,
  bookingIntegrationController.findMatchingAgencies.bind(bookingIntegrationController)
)
router.post(
  "/assign-service",
  assignServiceValidation,
  requireAgencyStaff,
  bookingIntegrationController.assignServiceToAgency.bind(bookingIntegrationController)
)
router.post(
  "/auto-assign",
  findMatchingAgenciesValidation,
  bookingIntegrationController.autoAssignBestMatch.bind(bookingIntegrationController)
)

// Assignment management
router.get(
  "/assignment/:assignmentId/status",
  assignmentIdValidation,
  bookingIntegrationController.getAssignmentStatus.bind(bookingIntegrationController)
)
router.post(
  "/assignment/:assignmentId/commission",
  calculateCommissionValidation,
  bookingIntegrationController.calculateCommission.bind(bookingIntegrationController)
)

export default router
