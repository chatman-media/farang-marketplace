import { FastifyRequest, FastifyReply } from "fastify"
import { CRMService } from "../services/CRMService"
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateLeadRequest,
  UpdateLeadRequest,
  CustomerStatus,
  LeadStatus,
  LeadPriority,
} from "@marketplace/shared-types"

// Extend Fastify Request interface to include user property
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    role: string
    email?: string
  }
}

export class CRMController {
  private crmService: CRMService

  constructor() {
    this.crmService = new CRMService()
  }

  // Health check endpoint
  healthCheck = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    return reply.send({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "crm-service",
      version: "2.0.0",
      framework: "Fastify 5.x",
    })
  }

  // Customer endpoints
  createCustomer = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const customerData: CreateCustomerRequest = request.body as CreateCustomerRequest
      const customer = await this.crmService.createCustomer(customerData)

      return reply.status(201).send({
        success: true,
        data: customer.toJSON(),
        message: "Customer created successfully",
      })
    } catch (error: any) {
      request.log.error("Error creating customer:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  getCustomers = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = request.query as any
      const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = query

      const customers = await this.crmService.getCustomers(
        {
          status: status as CustomerStatus,
          search,
        },
        {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      )

      return reply.send({
        success: true,
        data: customers,
        message: "Customers retrieved successfully",
      })
    } catch (error: any) {
      request.log.error("Error getting customers:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  getCustomer = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const customer = await this.crmService.getCustomerById(id)

      if (!customer) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Customer not found",
        })
      }

      return reply.send({
        success: true,
        data: customer.toJSON(),
        message: "Customer retrieved successfully",
      })
    } catch (error: any) {
      request.log.error("Error getting customer:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  updateCustomer = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const updateData: UpdateCustomerRequest = request.body as UpdateCustomerRequest

      const customer = await this.crmService.updateCustomer(id, updateData)

      if (!customer) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Customer not found",
        })
      }

      return reply.send({
        success: true,
        data: customer.toJSON(),
        message: "Customer updated successfully",
      })
    } catch (error: any) {
      request.log.error("Error updating customer:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  deleteCustomer = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const success = await this.crmService.deleteCustomer(id)

      if (!success) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Customer not found",
        })
      }

      return reply.send({
        success: true,
        message: "Customer deleted successfully",
      })
    } catch (error: any) {
      request.log.error("Error deleting customer:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  // Lead endpoints
  createLead = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const leadData: CreateLeadRequest = request.body as CreateLeadRequest
      const lead = await this.crmService.createLead(leadData)

      return reply.status(201).send({
        success: true,
        data: lead.toJSON(),
        message: "Lead created successfully",
      })
    } catch (error: any) {
      request.log.error("Error creating lead:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  getLeads = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = request.query as any
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        customerId,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query

      const leads = await this.crmService.getLeads(
        {
          status: status as LeadStatus,
          priority: priority as LeadPriority,
          customerId,
        },
        {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      )

      return reply.send({
        success: true,
        data: leads,
        message: "Leads retrieved successfully",
      })
    } catch (error: any) {
      request.log.error("Error getting leads:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  getLead = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const lead = await this.crmService.getLeadById(id)

      if (!lead) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Lead not found",
        })
      }

      return reply.send({
        success: true,
        data: lead.toJSON(),
        message: "Lead retrieved successfully",
      })
    } catch (error: any) {
      request.log.error("Error getting lead:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  updateLead = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const updateData: UpdateLeadRequest = request.body as UpdateLeadRequest

      const lead = await this.crmService.updateLead(id, updateData)

      if (!lead) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Lead not found",
        })
      }

      return reply.send({
        success: true,
        data: lead.toJSON(),
        message: "Lead updated successfully",
      })
    } catch (error: any) {
      request.log.error("Error updating lead:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  deleteLead = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const success = await this.crmService.deleteLead(id)

      if (!success) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Lead not found",
        })
      }

      return reply.send({
        success: true,
        message: "Lead deleted successfully",
      })
    } catch (error: any) {
      request.log.error("Error deleting lead:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }

  // Analytics endpoint
  getAnalytics = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = request.query as any
      const { startDate, endDate, groupBy = "day" } = query

      const analytics = await this.crmService.getCRMAnalytics()

      return reply.send({
        success: true,
        data: analytics,
        message: "Analytics retrieved successfully",
      })
    } catch (error: any) {
      request.log.error("Error getting analytics:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: error.message,
      })
    }
  }
}
