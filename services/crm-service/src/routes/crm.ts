import { Router } from "express"
import { CRMController } from "../controllers/CRMController"
import { authenticateToken, requireRole } from "../middleware/auth"
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCreateLead,
  validateUpdateLead,
  validateCustomerQuery,
  validateLeadQuery,
  validateUUIDParam,
} from "../middleware/validation"

const router = Router()
const crmController = new CRMController()

// Health check (no auth required)
router.get("/health", crmController.healthCheck)

// All other routes require authentication
router.use(authenticateToken)

// Customer routes
router.post("/customers", validateCreateCustomer, crmController.createCustomer)
router.get("/customers", validateCustomerQuery, crmController.getCustomers)
router.get("/customers/:id", validateUUIDParam, crmController.getCustomer)
router.put("/customers/:id", validateUpdateCustomer, crmController.updateCustomer)
router.delete(
  "/customers/:id",
  validateUUIDParam,
  requireRole(["admin"]),
  crmController.deleteCustomer
)

// Lead routes
router.post("/leads", validateCreateLead, crmController.createLead)
router.get("/leads", validateLeadQuery, crmController.getLeads)
router.get("/leads/:id", validateUUIDParam, crmController.getLead)
router.put("/leads/:id", validateUpdateLead, crmController.updateLead)
router.delete(
  "/leads/:id",
  validateUUIDParam,
  requireRole(["admin", "manager"]),
  crmController.deleteLead
)

// Analytics routes (admin and manager only)
router.get("/analytics", requireRole(["admin", "manager"]), crmController.getAnalytics)

export default router
