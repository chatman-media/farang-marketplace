import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { CRMController } from "../controllers/CRMController"
import { authenticateToken, requireRole } from "../middleware/auth"
import {
  createCustomerSchema,
  updateCustomerSchema,
  createLeadSchema,
  updateLeadSchema,
  customerQuerySchema,
  leadQuerySchema,
  uuidParamSchema,
} from "../middleware/validation"

const crmController = new CRMController()

const crmRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check (no auth required)
  fastify.get("/health", crmController.healthCheck)

  // Customer routes with authentication
  fastify.post(
    "/customers",
    {
      preHandler: [authenticateToken],
      schema: createCustomerSchema,
    },
    crmController.createCustomer,
  )

  fastify.get(
    "/customers",
    {
      preHandler: [authenticateToken],
      schema: customerQuerySchema,
    },
    crmController.getCustomers,
  )

  fastify.get(
    "/customers/:id",
    {
      preHandler: [authenticateToken],
      schema: uuidParamSchema,
    },
    crmController.getCustomer,
  )

  fastify.put(
    "/customers/:id",
    {
      preHandler: [authenticateToken],
      schema: updateCustomerSchema,
    },
    crmController.updateCustomer,
  )

  fastify.delete(
    "/customers/:id",
    {
      preHandler: [authenticateToken, requireRole(["admin"])],
      schema: uuidParamSchema,
    },
    crmController.deleteCustomer,
  )

  // Lead routes with authentication
  fastify.post(
    "/leads",
    {
      preHandler: [authenticateToken],
      schema: createLeadSchema,
    },
    crmController.createLead,
  )

  fastify.get(
    "/leads",
    {
      preHandler: [authenticateToken],
      schema: leadQuerySchema,
    },
    crmController.getLeads,
  )

  fastify.get(
    "/leads/:id",
    {
      preHandler: [authenticateToken],
      schema: uuidParamSchema,
    },
    crmController.getLead,
  )

  fastify.put(
    "/leads/:id",
    {
      preHandler: [authenticateToken],
      schema: updateLeadSchema,
    },
    crmController.updateLead,
  )

  fastify.delete(
    "/leads/:id",
    {
      preHandler: [authenticateToken, requireRole(["admin", "manager"])],
      schema: uuidParamSchema,
    },
    crmController.deleteLead,
  )

  // Analytics routes (admin and manager only)
  fastify.get(
    "/analytics",
    {
      preHandler: [authenticateToken, requireRole(["admin", "manager"])],
    },
    crmController.getAnalytics,
  )
}

export default crmRoutes
