import { Request, Response } from "express"
import { validationResult } from "express-validator"
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

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
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

  // Customer endpoints
  createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
        })
        return
      }

      const customerData: CreateCustomerRequest = req.body
      const customer = await this.crmService.createCustomer(customerData)

      res.status(201).json({
        success: true,
        data: customer.toJSON(),
        message: "Customer created successfully",
      })
    } catch (error: any) {
      console.error("Error creating customer:", error)

      if (error.message.includes("already exists")) {
        res.status(409).json({
          error: "Conflict",
          message: error.message,
        })
      } else if (error.message.includes("Validation failed")) {
        res.status(400).json({
          error: "Validation Error",
          message: error.message,
        })
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to create customer",
        })
      }
    }
  }

  getCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const customer = await this.crmService.getCustomerById(id)

      if (!customer) {
        res.status(404).json({
          error: "Not Found",
          message: "Customer not found",
        })
        return
      }

      res.json({
        success: true,
        data: customer.toJSON(),
      })
    } catch (error: any) {
      console.error("Error getting customer:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get customer",
      })
    }
  }

  updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
        })
        return
      }

      const { id } = req.params
      const updateData: UpdateCustomerRequest = req.body
      const customer = await this.crmService.updateCustomer(id, updateData)

      if (!customer) {
        res.status(404).json({
          error: "Not Found",
          message: "Customer not found",
        })
        return
      }

      res.json({
        success: true,
        data: customer.toJSON(),
        message: "Customer updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating customer:", error)

      if (error.message.includes("Validation failed")) {
        res.status(400).json({
          error: "Validation Error",
          message: error.message,
        })
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to update customer",
        })
      }
    }
  }

  deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      // Only admin can delete customers
      if (req.user?.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Only administrators can delete customers",
        })
        return
      }

      const deleted = await this.crmService.deleteCustomer(id)

      if (!deleted) {
        res.status(404).json({
          error: "Not Found",
          message: "Customer not found",
        })
        return
      }

      res.json({
        success: true,
        message: "Customer deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete customer",
      })
    }
  }

  getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status, tags, search, page = "1", limit = "20" } = req.query

      const filters: any = {}
      if (status) filters.status = status as CustomerStatus
      if (tags) filters.tags = Array.isArray(tags) ? (tags as string[]) : [tags as string]
      if (search) filters.search = search as string

      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // Cap at 100
      }

      const result = await this.crmService.getCustomers(filters, pagination)

      res.json({
        success: true,
        data: result.customers.map((customer) => customer.toJSON()),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      })
    } catch (error: any) {
      console.error("Error getting customers:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get customers",
      })
    }
  }

  // Lead endpoints
  createLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
        })
        return
      }

      const leadData: CreateLeadRequest = req.body
      const lead = await this.crmService.createLead(leadData)

      res.status(201).json({
        success: true,
        data: lead.toJSON(),
        message: "Lead created successfully",
      })
    } catch (error: any) {
      console.error("Error creating lead:", error)

      if (error.message.includes("not found")) {
        res.status(404).json({
          error: "Not Found",
          message: error.message,
        })
      } else if (error.message.includes("Validation failed")) {
        res.status(400).json({
          error: "Validation Error",
          message: error.message,
        })
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to create lead",
        })
      }
    }
  }

  getLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const lead = await this.crmService.getLeadById(id)

      if (!lead) {
        res.status(404).json({
          error: "Not Found",
          message: "Lead not found",
        })
        return
      }

      res.json({
        success: true,
        data: lead.toJSON(),
      })
    } catch (error: any) {
      console.error("Error getting lead:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get lead",
      })
    }
  }

  updateLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
        })
        return
      }

      const { id } = req.params
      const updateData: UpdateLeadRequest = req.body
      const lead = await this.crmService.updateLead(id, updateData)

      if (!lead) {
        res.status(404).json({
          error: "Not Found",
          message: "Lead not found",
        })
        return
      }

      res.json({
        success: true,
        data: lead.toJSON(),
        message: "Lead updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating lead:", error)

      if (error.message.includes("Validation failed")) {
        res.status(400).json({
          error: "Validation Error",
          message: error.message,
        })
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to update lead",
        })
      }
    }
  }

  deleteLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      // Only admin and managers can delete leads
      if (!["admin", "manager"].includes(req.user?.role || "")) {
        res.status(403).json({
          error: "Forbidden",
          message: "Insufficient permissions to delete leads",
        })
        return
      }

      const deleted = await this.crmService.deleteLead(id)

      if (!deleted) {
        res.status(404).json({
          error: "Not Found",
          message: "Lead not found",
        })
        return
      }

      res.json({
        success: true,
        message: "Lead deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting lead:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete lead",
      })
    }
  }

  getLeads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status, priority, assignedTo, customerId, page = "1", limit = "20" } = req.query

      const filters: any = {}
      if (status) filters.status = status as LeadStatus
      if (priority) filters.priority = priority as LeadPriority
      if (assignedTo) filters.assignedTo = assignedTo as string
      if (customerId) filters.customerId = customerId as string

      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // Cap at 100
      }

      const result = await this.crmService.getLeads(filters, pagination)

      res.json({
        success: true,
        data: result.leads.map((lead) => lead.toJSON()),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      })
    } catch (error: any) {
      console.error("Error getting leads:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get leads",
      })
    }
  }

  // Analytics endpoint
  getAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Only admin and managers can view analytics
      if (!["admin", "manager"].includes(req.user?.role || "")) {
        res.status(403).json({
          error: "Forbidden",
          message: "Insufficient permissions to view analytics",
        })
        return
      }

      const analytics = await this.crmService.getCRMAnalytics()

      res.json({
        success: true,
        data: analytics,
      })
    } catch (error: any) {
      console.error("Error getting analytics:", error)
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get analytics",
      })
    }
  }

  // Health check
  healthCheck = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.json({
        status: "healthy",
        service: "crm-service",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      })
    } catch (error: any) {
      console.error("Health check failed:", error)
      res.status(500).json({
        status: "unhealthy",
        service: "crm-service",
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
