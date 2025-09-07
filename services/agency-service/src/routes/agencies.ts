import { Router } from "express"
import {
  AgencyController,
  createAgencyValidation,
  updateAgencyValidation,
  agencyIdValidation,
  verifyAgencyValidation,
  rejectAgencyValidation,
} from "../controllers/AgencyController.js"
import {
  authenticateToken,
  requireAdmin,
  requireAgencyStaff,
  requireAgencyOwnership,
  optionalAuth,
} from "../middleware/auth.js"

const router = Router()
const agencyController = new AgencyController()

// Public routes
router.get("/search", optionalAuth, agencyController.searchAgencies.bind(agencyController))
router.get(
  "/:id",
  agencyIdValidation,
  optionalAuth,
  agencyController.getAgencyById.bind(agencyController)
)

// Protected routes - require authentication
router.use(authenticateToken)

// User routes - create and manage own agency
router.post("/", createAgencyValidation, agencyController.createAgency.bind(agencyController))
router.get("/me/agency", agencyController.getMyAgency.bind(agencyController))

// Agency management routes - require agency ownership or admin
router.put(
  "/:id",
  updateAgencyValidation,
  requireAgencyOwnership,
  agencyController.updateAgency.bind(agencyController)
)
router.delete(
  "/:id",
  agencyIdValidation,
  requireAgencyOwnership,
  agencyController.deleteAgency.bind(agencyController)
)

// Statistics routes - require agency ownership or admin
router.get(
  "/:id/stats",
  agencyIdValidation,
  requireAgencyOwnership,
  agencyController.getAgencyStats.bind(agencyController)
)

// Admin only routes
router.post(
  "/:id/verify",
  verifyAgencyValidation,
  requireAdmin,
  agencyController.verifyAgency.bind(agencyController)
)
router.post(
  "/:id/reject",
  rejectAgencyValidation,
  requireAdmin,
  agencyController.rejectAgencyVerification.bind(agencyController)
)

export default router
