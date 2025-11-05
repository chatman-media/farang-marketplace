import { CustomerStatus, LeadPriority, LeadStatus } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CRMController } from "../controllers/CRMController"

// Mock services
vi.mock("../services/CRMService")
vi.mock("../services/AutomationService")

describe("CRMController", () => {
  let controller: CRMController
  let mockRequest: any
  let mockReply: any

  beforeEach(() => {
    vi.clearAllMocks()

    controller = new CRMController()

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: "user-123",
        role: "admin",
        email: "admin@test.com",
      },
      log: {
        error: vi.fn(),
        info: vi.fn(),
      },
    }

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
  })

  describe("healthCheck", () => {
    it("should return health status", async () => {
      await controller.healthCheck(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        status: "healthy",
        timestamp: expect.any(String),
        service: "crm-service",
        version: "2.0.0",
        framework: "Fastify 5.x",
      })
    })
  })

  describe("createCustomer", () => {
    it("should create customer successfully", async () => {
      const customerData = {
        name: "John Doe",
        email: "john@test.com",
        phone: "+1234567890",
      }

      const mockCustomer = {
        id: "customer-123",
        ...customerData,
        toJSON: vi.fn().mockReturnValue({ id: "customer-123", ...customerData }),
      }

      mockRequest.body = customerData
      vi.spyOn(controller.crmService, "createCustomer").mockResolvedValue(mockCustomer as any)

      await controller.createCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "customer-123", ...customerData },
        message: "Customer created successfully",
      })
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.crmService, "createCustomer").mockRejectedValue(error)

      mockRequest.body = { name: "Test" }

      await controller.createCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "Database error",
      })
    })
  })

  describe("getCustomers", () => {
    it("should get customers with default pagination", async () => {
      const mockCustomers = [{ id: "customer-1" }, { id: "customer-2" }]

      vi.spyOn(controller.crmService, "getCustomers").mockResolvedValue(mockCustomers as any)

      await controller.getCustomers(mockRequest, mockReply)

      expect(controller.crmService.getCustomers).toHaveBeenCalledWith(
        { status: undefined, search: undefined },
        { page: 1, limit: 10 },
      )
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockCustomers,
        message: "Customers retrieved successfully",
      })
    })

    it("should get customers with custom filters", async () => {
      mockRequest.query = {
        page: "2",
        limit: "20",
        status: CustomerStatus.ACTIVE,
        search: "john",
      }

      const mockCustomers = [{ id: "customer-1" }]
      vi.spyOn(controller.crmService, "getCustomers").mockResolvedValue(mockCustomers as any)

      await controller.getCustomers(mockRequest, mockReply)

      expect(controller.crmService.getCustomers).toHaveBeenCalledWith(
        { status: CustomerStatus.ACTIVE, search: "john" },
        { page: 2, limit: 20 },
      )
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.crmService, "getCustomers").mockRejectedValue(error)

      await controller.getCustomers(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "Database error",
      })
    })
  })

  describe("getCustomer", () => {
    it("should get customer by id", async () => {
      mockRequest.params = { id: "customer-123" }

      const mockCustomer = {
        id: "customer-123",
        name: "John Doe",
        toJSON: vi.fn().mockReturnValue({ id: "customer-123", name: "John Doe" }),
      }

      vi.spyOn(controller.crmService, "getCustomerById").mockResolvedValue(mockCustomer as any)

      await controller.getCustomer(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "customer-123", name: "John Doe" },
        message: "Customer retrieved successfully",
      })
    })

    it("should return 404 if customer not found", async () => {
      mockRequest.params = { id: "non-existent" }

      vi.spyOn(controller.crmService, "getCustomerById").mockResolvedValue(null)

      await controller.getCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Not Found",
        message: "Customer not found",
      })
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "customer-123" }
      const error = new Error("Database error")

      vi.spyOn(controller.crmService, "getCustomerById").mockRejectedValue(error)

      await controller.getCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateCustomer", () => {
    it("should update customer successfully", async () => {
      mockRequest.params = { id: "customer-123" }
      mockRequest.body = { name: "Updated Name" }

      const mockCustomer = {
        id: "customer-123",
        name: "Updated Name",
        toJSON: vi.fn().mockReturnValue({ id: "customer-123", name: "Updated Name" }),
      }

      vi.spyOn(controller.crmService, "updateCustomer").mockResolvedValue(mockCustomer as any)

      await controller.updateCustomer(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "customer-123", name: "Updated Name" },
        message: "Customer updated successfully",
      })
    })

    it("should return 404 if customer not found", async () => {
      mockRequest.params = { id: "non-existent" }
      mockRequest.body = { name: "Updated" }

      vi.spyOn(controller.crmService, "updateCustomer").mockResolvedValue(null)

      await controller.updateCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Not Found",
        message: "Customer not found",
      })
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "customer-123" }
      mockRequest.body = { name: "Updated" }
      const error = new Error("Database error")

      vi.spyOn(controller.crmService, "updateCustomer").mockRejectedValue(error)

      await controller.updateCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("deleteCustomer", () => {
    it("should delete customer successfully", async () => {
      mockRequest.params = { id: "customer-123" }

      vi.spyOn(controller.crmService, "deleteCustomer").mockResolvedValue(true)

      await controller.deleteCustomer(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Customer deleted successfully",
      })
    })

    it("should return 404 if customer not found", async () => {
      mockRequest.params = { id: "non-existent" }

      vi.spyOn(controller.crmService, "deleteCustomer").mockResolvedValue(false)

      await controller.deleteCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Not Found",
        message: "Customer not found",
      })
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "customer-123" }
      const error = new Error("Database error")

      vi.spyOn(controller.crmService, "deleteCustomer").mockRejectedValue(error)

      await controller.deleteCustomer(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("createLead", () => {
    it("should create lead successfully", async () => {
      const leadData = {
        customerId: "customer-123",
        source: "website",
        status: LeadStatus.NEW,
      }

      const mockLead = {
        id: "lead-123",
        ...leadData,
        toJSON: vi.fn().mockReturnValue({ id: "lead-123", ...leadData }),
      }

      mockRequest.body = leadData
      vi.spyOn(controller.crmService, "createLead").mockResolvedValue(mockLead as any)

      await controller.createLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "lead-123", ...leadData },
        message: "Lead created successfully",
      })
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.crmService, "createLead").mockRejectedValue(error)

      mockRequest.body = { customerId: "customer-123" }

      await controller.createLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getLeads", () => {
    it("should get leads with default pagination", async () => {
      const mockLeads = [{ id: "lead-1" }, { id: "lead-2" }]

      vi.spyOn(controller.crmService, "getLeads").mockResolvedValue(mockLeads as any)

      await controller.getLeads(mockRequest, mockReply)

      expect(controller.crmService.getLeads).toHaveBeenCalledWith(
        { status: undefined, priority: undefined, customerId: undefined },
        { page: 1, limit: 10 },
      )
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockLeads,
        message: "Leads retrieved successfully",
      })
    })

    it("should get leads with custom filters", async () => {
      mockRequest.query = {
        page: "2",
        limit: "20",
        status: LeadStatus.QUALIFIED,
        priority: LeadPriority.HIGH,
        customerId: "customer-123",
      }

      const mockLeads = [{ id: "lead-1" }]
      vi.spyOn(controller.crmService, "getLeads").mockResolvedValue(mockLeads as any)

      await controller.getLeads(mockRequest, mockReply)

      expect(controller.crmService.getLeads).toHaveBeenCalledWith(
        { status: LeadStatus.QUALIFIED, priority: LeadPriority.HIGH, customerId: "customer-123" },
        { page: 2, limit: 20 },
      )
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.crmService, "getLeads").mockRejectedValue(error)

      await controller.getLeads(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getLead", () => {
    it("should get lead by id", async () => {
      mockRequest.params = { id: "lead-123" }

      const mockLead = {
        id: "lead-123",
        customerId: "customer-123",
        toJSON: vi.fn().mockReturnValue({ id: "lead-123", customerId: "customer-123" }),
      }

      vi.spyOn(controller.crmService, "getLeadById").mockResolvedValue(mockLead as any)

      await controller.getLead(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "lead-123", customerId: "customer-123" },
        message: "Lead retrieved successfully",
      })
    })

    it("should return 404 if lead not found", async () => {
      mockRequest.params = { id: "non-existent" }

      vi.spyOn(controller.crmService, "getLeadById").mockResolvedValue(null)

      await controller.getLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Not Found",
        message: "Lead not found",
      })
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "lead-123" }
      const error = new Error("Database error")

      vi.spyOn(controller.crmService, "getLeadById").mockRejectedValue(error)

      await controller.getLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("updateLead", () => {
    it("should update lead successfully", async () => {
      mockRequest.params = { id: "lead-123" }
      mockRequest.body = { status: LeadStatus.QUALIFIED }

      const mockLead = {
        id: "lead-123",
        status: LeadStatus.QUALIFIED,
        toJSON: vi.fn().mockReturnValue({ id: "lead-123", status: LeadStatus.QUALIFIED }),
      }

      vi.spyOn(controller.crmService, "updateLead").mockResolvedValue(mockLead as any)

      await controller.updateLead(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "lead-123", status: LeadStatus.QUALIFIED },
        message: "Lead updated successfully",
      })
    })

    it("should return 404 if lead not found", async () => {
      mockRequest.params = { id: "non-existent" }
      mockRequest.body = { status: LeadStatus.QUALIFIED }

      vi.spyOn(controller.crmService, "updateLead").mockResolvedValue(null)

      await controller.updateLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "lead-123" }
      mockRequest.body = { status: LeadStatus.QUALIFIED }
      const error = new Error("Database error")

      vi.spyOn(controller.crmService, "updateLead").mockRejectedValue(error)

      await controller.updateLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("deleteLead", () => {
    it("should delete lead successfully", async () => {
      mockRequest.params = { id: "lead-123" }

      vi.spyOn(controller.crmService, "deleteLead").mockResolvedValue(true)

      await controller.deleteLead(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Lead deleted successfully",
      })
    })

    it("should return 404 if lead not found", async () => {
      mockRequest.params = { id: "non-existent" }

      vi.spyOn(controller.crmService, "deleteLead").mockResolvedValue(false)

      await controller.deleteLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "lead-123" }
      const error = new Error("Database error")

      vi.spyOn(controller.crmService, "deleteLead").mockRejectedValue(error)

      await controller.deleteLead(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAnalytics", () => {
    it("should get analytics successfully", async () => {
      const mockAnalytics = {
        totalCustomers: 100,
        activeCustomers: 80,
        totalLeads: 50,
      }

      vi.spyOn(controller.crmService, "getCRMAnalytics").mockResolvedValue(mockAnalytics)

      await controller.getAnalytics(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAnalytics,
        message: "Analytics retrieved successfully",
      })
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.crmService, "getCRMAnalytics").mockRejectedValue(error)

      await controller.getAnalytics(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAutomations", () => {
    it("should get all automations", async () => {
      const mockAutomations = [{ id: "auto-1" }, { id: "auto-2" }]

      vi.spyOn(controller.automationService, "getAutomations").mockResolvedValue(mockAutomations as any)

      await controller.getAutomations(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAutomations,
        message: "Automations retrieved successfully",
      })
    })

    it("should filter by isActive", async () => {
      mockRequest.query = { isActive: "true" }
      const mockAutomations = [{ id: "auto-1", isActive: true }]

      vi.spyOn(controller.automationService, "getAutomations").mockResolvedValue(mockAutomations as any)

      await controller.getAutomations(mockRequest, mockReply)

      expect(controller.automationService.getAutomations).toHaveBeenCalledWith({ isActive: "true" })
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.automationService, "getAutomations").mockRejectedValue(error)

      await controller.getAutomations(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("createAutomation", () => {
    it("should create automation successfully", async () => {
      const automationData = {
        name: "Welcome Automation",
        trigger: { type: "customer_created" },
        actions: [],
        isActive: true,
        createdBy: "user-123",
      }

      mockRequest.body = automationData

      const mockAutomation = { id: "auto-123", ...automationData }

      vi.spyOn(controller.automationService, "createAutomation").mockResolvedValue(mockAutomation as any)

      await controller.createAutomation(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAutomation,
        message: "Automation created successfully",
      })
    })

    it("should set createdBy from authenticated user", async () => {
      const automationData = {
        name: "Test Automation",
        trigger: { type: "lead_created" },
        actions: [],
        isActive: true,
      }

      mockRequest.body = automationData
      mockRequest.user = { id: "user-456", role: "admin" }

      vi.spyOn(controller.automationService, "createAutomation").mockResolvedValue({ id: "auto-123" } as any)

      await controller.createAutomation(mockRequest, mockReply)

      expect(controller.automationService.createAutomation).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: "user-456",
        }),
      )
    })

    it("should handle errors", async () => {
      const error = new Error("Database error")
      vi.spyOn(controller.automationService, "createAutomation").mockRejectedValue(error)

      mockRequest.body = { name: "Test" }

      await controller.createAutomation(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("getAutomationById", () => {
    it("should get automation by id", async () => {
      mockRequest.params = { id: "auto-123" }

      const mockAutomation = { id: "auto-123", name: "Test Automation" }

      vi.spyOn(controller.automationService, "getAutomationById").mockResolvedValue(mockAutomation as any)

      await controller.getAutomationById(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAutomation,
        message: "Automation retrieved successfully",
      })
    })

    it("should return 404 if automation not found", async () => {
      mockRequest.params = { id: "non-existent" }

      vi.spyOn(controller.automationService, "getAutomationById").mockResolvedValue(null)

      await controller.getAutomationById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
    })

    it("should handle errors", async () => {
      mockRequest.params = { id: "auto-123" }
      const error = new Error("Database error")

      vi.spyOn(controller.automationService, "getAutomationById").mockRejectedValue(error)

      await controller.getAutomationById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })

  describe("triggerWorkflow", () => {
    it("should trigger workflow successfully", async () => {
      mockRequest.params = { eventName: "customer_created" }
      mockRequest.body = { customerId: "customer-123" }

      vi.spyOn(controller.automationService, "triggerWorkflow").mockResolvedValue(undefined)

      await controller.triggerWorkflow(mockRequest, mockReply)

      expect(controller.automationService.triggerWorkflow).toHaveBeenCalledWith("customer_created", {
        customerId: "customer-123",
      })
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Workflow customer_created triggered successfully",
      })
    })

    it("should handle errors", async () => {
      mockRequest.params = { eventName: "test_event" }
      mockRequest.body = { data: "test" }
      const error = new Error("Workflow error")

      vi.spyOn(controller.automationService, "triggerWorkflow").mockRejectedValue(error)

      await controller.triggerWorkflow(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })
})
