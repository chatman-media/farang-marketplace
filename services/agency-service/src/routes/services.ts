import { Router } from "express"
import {
  AgencyServiceController,
  createServiceValidation,
  updateServiceValidation,
  serviceIdValidation,
  agencyIdValidation,
  bulkUpdatePricesValidation,
} from "../controllers/AgencyServiceController.js"
import {
  authenticateToken,
  requireAgencyStaff,
  requireAgencyOwnership,
  optionalAuth,
} from "../middleware/auth.js"

const router = Router()
const agencyServiceController = new AgencyServiceController()

// Public routes
router.get(
  "/search",
  optionalAuth,
  agencyServiceController.searchServices.bind(agencyServiceController)
)

// Protected routes - require authentication
router.use(authenticateToken)

// Service management routes
router.post(
  "/",
  createServiceValidation,
  requireAgencyStaff,
  agencyServiceController.createService.bind(agencyServiceController)
)
router.get(
  "/:id",
  serviceIdValidation,
  agencyServiceController.getServiceById.bind(agencyServiceController)
)
router.put(
  "/:id",
  updateServiceValidation,
  requireAgencyStaff,
  agencyServiceController.updateService.bind(agencyServiceController)
)
router.delete(
  "/:id",
  serviceIdValidation,
  requireAgencyStaff,
  agencyServiceController.deleteService.bind(agencyServiceController)
)

// Agency-specific service routes
router.get(
  "/agency/:agencyId",
  agencyIdValidation,
  requireAgencyOwnership,
  agencyServiceController.getServicesByAgency.bind(agencyServiceController)
)

// Service status management
router.patch(
  "/:id/toggle-status",
  serviceIdValidation,
  requireAgencyStaff,
  agencyServiceController.toggleServiceStatus.bind(agencyServiceController)
)

// Bulk operations
router.patch(
  "/agency/:agencyId/bulk-update-prices",
  bulkUpdatePricesValidation,
  requireAgencyOwnership,
  agencyServiceController.bulkUpdatePrices.bind(agencyServiceController)
)

export default router
