import {
  CreateCustomerRequest,
  CreateLeadRequest,
  CustomerStatus,
  LeadPriority,
  LeadSource,
  LeadStatus,
  UpdateCustomerRequest,
  UpdateLeadRequest,
} from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { query } from "../db/connection"
import { Customer } from "../models/Customer"
import { Lead } from "../models/Lead"
import { CRMService } from "../services/CRMService"

// Mock the database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

const mockQuery = query as any

describe("CRMService", () => {
  let crmService: CRMService

  // Shared mock data
  const mockCustomerData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: null,
    email: "test@example.com",
    phone: "+1234567890",
    telegram_id: null,
    whatsapp_id: null,
    first_name: "John",
    last_name: "Doe",
    preferred_language: "en",
    preferred_channel: "email",
    status: "lead",
    lead_score: 0,
    tags: [],
    custom_fields: {},
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }

  const mockLeadData = {
    id: "lead-123",
    customer_id: "customer-123",
    listing_id: null,
    source: "website",
    status: "new",
    priority: "medium",
    assigned_to: null,
    value: 5000,
    notes: "",
    follow_up_date: null,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    mockQuery.mockReset()
    crmService = new CRMService()
  })

  describe("Customer Management", () => {
    describe("createCustomer", () => {
      it("should create a customer successfully", async () => {
        const createRequest: CreateCustomerRequest = {
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
        }

        // Mock email check (no existing customer)
        mockQuery.mockResolvedValueOnce({ rows: [] })
        // Mock insert
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        const result = await crmService.createCustomer(createRequest)

        expect(result).toBeInstanceOf(Customer)
        expect(result.email).toBe(createRequest.email)
        expect(result.firstName).toBe(createRequest.firstName)
        expect(result.lastName).toBe(createRequest.lastName)
        expect(mockQuery).toHaveBeenCalledTimes(2)
      })

      it("should throw error if customer with email already exists", async () => {
        const createRequest: CreateCustomerRequest = {
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        }

        // Mock existing customer
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        await expect(crmService.createCustomer(createRequest)).rejects.toThrow(
          "Customer with this email already exists",
        )
      })

      it("should throw validation error for invalid data", async () => {
        const invalidRequest = {
          email: "invalid-email",
          firstName: "",
          lastName: "Doe",
        } as CreateCustomerRequest

        await expect(crmService.createCustomer(invalidRequest)).rejects.toThrow("Validation failed")
      })
    })

    describe("getCustomerById", () => {
      it("should return customer if found", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        const result = await crmService.getCustomerById("123")

        expect(result).toBeInstanceOf(Customer)
        expect(result?.id).toBe(mockCustomerData.id)
      })

      it("should return null if customer not found", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const result = await crmService.getCustomerById("nonexistent")

        expect(result).toBeNull()
      })
    })

    describe("updateCustomer", () => {
      it("should update customer successfully", async () => {
        const updateRequest: UpdateCustomerRequest = {
          firstName: "Jane",
          leadScore: 85,
        }

        const updatedData = { ...mockCustomerData, first_name: "Jane", lead_score: 85 }
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })

        const result = await crmService.updateCustomer("123", updateRequest)

        expect(result).toBeInstanceOf(Customer)
        expect(result?.firstName).toBe("Jane")
        expect(result?.leadScore).toBe(85)
      })

      it("should return existing customer if no updates provided", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        const result = await crmService.updateCustomer("123", {})

        expect(result).toBeInstanceOf(Customer)
        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM customers WHERE id = $1"), [
          "123",
        ])
      })

      it("should throw validation error for invalid data", async () => {
        const invalidRequest = {
          leadScore: 150, // Invalid score
        } as UpdateCustomerRequest

        await expect(crmService.updateCustomer("123", invalidRequest)).rejects.toThrow("Validation failed")
      })
    })

    describe("getCustomers", () => {
      it("should return paginated customers with filters", async () => {
        const customers = [mockCustomerData, { ...mockCustomerData, id: "456" }]

        // Mock count query
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "2" }] })
        // Mock data query
        mockQuery.mockResolvedValueOnce({ rows: customers })

        const result = await crmService.getCustomers({ status: CustomerStatus.LEAD }, { page: 1, limit: 10 })

        expect(result.customers).toHaveLength(2)
        expect(result.total).toBe(2)
        expect(result.page).toBe(1)
        expect(result.limit).toBe(10)
        expect(result.customers[0]).toBeInstanceOf(Customer)
      })

      it("should handle search filters", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        await crmService.getCustomers({ search: "john" })

        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("ILIKE"), expect.arrayContaining(["%john%"]))
      })

      it("should handle tag filters", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        await crmService.getCustomers({ tags: ["vip", "premium"] })

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("tags &&"),
          expect.arrayContaining([["vip", "premium"]]),
        )
      })

      it("should handle multiple filters combined", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        await crmService.getCustomers({
          status: CustomerStatus.CUSTOMER,
          tags: ["vip"],
          search: "john",
        })

        expect(mockQuery).toHaveBeenCalledTimes(2)
      })
    })

    describe("getCustomerByEmail", () => {
      it("should return customer if found by email", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        const result = await crmService.getCustomerByEmail("test@example.com")

        expect(result).toBeInstanceOf(Customer)
        expect(result?.email).toBe(mockCustomerData.email)
      })

      it("should return null if customer not found by email", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const result = await crmService.getCustomerByEmail("notfound@example.com")

        expect(result).toBeNull()
      })
    })

    describe("getCustomerByUserId", () => {
      it("should return customer if found by user ID", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ ...mockCustomerData, user_id: "user-123" }] })

        const result = await crmService.getCustomerByUserId("user-123")

        expect(result).toBeInstanceOf(Customer)
        expect(result?.userId).toBe("user-123")
      })

      it("should return null if customer not found by user ID", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const result = await crmService.getCustomerByUserId("nonexistent-user")

        expect(result).toBeNull()
      })
    })

    describe("deleteCustomer", () => {
      it("should delete customer successfully", async () => {
        mockQuery.mockResolvedValueOnce({ rowCount: 1 })

        const result = await crmService.deleteCustomer("customer-123")

        expect(result).toBe(true)
        expect(mockQuery).toHaveBeenCalledWith("DELETE FROM customers WHERE id = $1", ["customer-123"])
      })

      it("should return false if customer not found", async () => {
        mockQuery.mockResolvedValueOnce({ rowCount: 0 })

        const result = await crmService.deleteCustomer("nonexistent")

        expect(result).toBe(false)
      })
    })
  })

  describe("Lead Management", () => {
    describe("createLead", () => {
      it("should create a lead successfully", async () => {
        const createRequest: CreateLeadRequest = {
          customerId: "customer-123",
          source: LeadSource.WEBSITE,
          priority: LeadPriority.HIGH,
          value: 5000,
          notes: "Initial contact",
        }

        // Mock customer exists check
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })
        // Mock lead insert
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })
        // Mock lead score calculation (getLeadsByCustomer)
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })
        // Mock customer update
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        const result = await crmService.createLead(createRequest)

        expect(result).toBeInstanceOf(Lead)
        expect(result.customerId).toBe(createRequest.customerId)
        expect(result.source).toBe(createRequest.source)
      })

      it("should throw error if customer not found", async () => {
        const createRequest: CreateLeadRequest = {
          customerId: "nonexistent",
          source: LeadSource.WEBSITE,
        }

        // Mock customer not found
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await expect(crmService.createLead(createRequest)).rejects.toThrow("Customer not found")
      })

      it("should throw validation error for invalid data", async () => {
        const invalidRequest = {
          customerId: "", // Invalid
          source: LeadSource.WEBSITE,
        } as CreateLeadRequest

        await expect(crmService.createLead(invalidRequest)).rejects.toThrow("Validation failed")
      })
    })

    describe("getLeadById", () => {
      it("should return lead if found", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        const result = await crmService.getLeadById("lead-123")

        expect(result).toBeInstanceOf(Lead)
        expect(result?.id).toBe(mockLeadData.id)
      })

      it("should return null if lead not found", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const result = await crmService.getLeadById("nonexistent")

        expect(result).toBeNull()
      })
    })

    describe("updateLead", () => {
      it("should update lead successfully", async () => {
        const updateRequest: UpdateLeadRequest = {
          status: LeadStatus.QUALIFIED,
          value: 7500,
        }

        const updatedData = { ...mockLeadData, status: "qualified", value: 7500 }
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })
        // Mock lead score calculation
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })
        // Mock customer update
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        const result = await crmService.updateLead("lead-123", updateRequest)

        expect(result).toBeInstanceOf(Lead)
        expect(result?.status).toBe(LeadStatus.QUALIFIED)
        expect(result?.value).toBe(7500)
      })

      it("should return existing lead if no updates provided", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        const result = await crmService.updateLead("lead-123", {})

        expect(result).toBeInstanceOf(Lead)
        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM leads WHERE id = $1"), [
          "lead-123",
        ])
      })

      it("should throw validation error for invalid data", async () => {
        const invalidRequest = {
          value: -1000, // Invalid value
        } as UpdateLeadRequest

        await expect(crmService.updateLead("lead-123", invalidRequest)).rejects.toThrow("Validation failed")
      })

      it("should return null if lead not found", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const result = await crmService.updateLead("nonexistent", { value: 5000 })

        expect(result).toBeNull()
      })

      it("should trigger automation when stage changes", async () => {
        const updateRequest: UpdateLeadRequest = {
          stage: "proposal",
        }

        const updatedData = { ...mockLeadData, stage: "proposal" }
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })
        // Mock getLeadById for oldLead
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        const result = await crmService.updateLead("lead-123", updateRequest)

        expect(result).toBeInstanceOf(Lead)
        expect(result?.stage).toBe("proposal")
      })

      it("should handle automation errors gracefully when status changes", async () => {
        const updateRequest: UpdateLeadRequest = {
          status: LeadStatus.QUALIFIED,
        }

        const updatedData = { ...mockLeadData, status: "qualified" }
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })
        // Mock getLeadById for oldLead
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })
        // Mock lead score calculation
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })
        // Mock customer update
        mockQuery.mockResolvedValueOnce({ rows: [mockCustomerData] })

        // Mock automation service to throw error
        const automationService = (crmService as any).automationService
        vi.spyOn(automationService, "triggerWorkflow").mockRejectedValueOnce(new Error("Automation failed"))

        const result = await crmService.updateLead("lead-123", updateRequest)

        // Should still return the updated lead despite automation error
        expect(result).toBeInstanceOf(Lead)
        expect(result?.status).toBe(LeadStatus.QUALIFIED)
      })

      it("should handle automation errors gracefully when stage changes", async () => {
        const updateRequest: UpdateLeadRequest = {
          stage: "negotiation",
        }

        const updatedData = { ...mockLeadData, stage: "negotiation" }
        mockQuery.mockResolvedValueOnce({ rows: [updatedData] })
        // Mock getLeadById for oldLead
        mockQuery.mockResolvedValueOnce({ rows: [{ ...mockLeadData, stage: "proposal" }] })

        // Mock automation service to throw error
        const automationService = (crmService as any).automationService
        vi.spyOn(automationService, "triggerWorkflow").mockRejectedValueOnce(new Error("Automation failed"))

        const result = await crmService.updateLead("lead-123", updateRequest)

        // Should still return the updated lead despite automation error
        expect(result).toBeInstanceOf(Lead)
        expect(result?.stage).toBe("negotiation")
      })
    })

    describe("deleteLead", () => {
      it("should delete lead successfully", async () => {
        mockQuery.mockResolvedValueOnce({ rowCount: 1 })

        const result = await crmService.deleteLead("lead-123")

        expect(result).toBe(true)
        expect(mockQuery).toHaveBeenCalledWith("DELETE FROM leads WHERE id = $1", ["lead-123"])
      })

      it("should return false if lead not found", async () => {
        mockQuery.mockResolvedValueOnce({ rowCount: 0 })

        const result = await crmService.deleteLead("nonexistent")

        expect(result).toBe(false)
      })
    })

    describe("getLeadsByCustomer", () => {
      it("should return all leads for a customer", async () => {
        const leads = [mockLeadData, { ...mockLeadData, id: "lead-456" }]
        mockQuery.mockResolvedValueOnce({ rows: leads })

        const result = await crmService.getLeadsByCustomer("customer-123")

        expect(result).toHaveLength(2)
        expect(result[0]).toBeInstanceOf(Lead)
        expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM leads WHERE customer_id = $1 ORDER BY created_at DESC", [
          "customer-123",
        ])
      })

      it("should return empty array if customer has no leads", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const result = await crmService.getLeadsByCustomer("customer-123")

        expect(result).toHaveLength(0)
      })
    })

    describe("getLeads", () => {
      it("should return paginated leads with filters", async () => {
        const leads = [mockLeadData, { ...mockLeadData, id: "lead-456" }]

        // Mock count query
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "2" }] })
        // Mock data query
        mockQuery.mockResolvedValueOnce({ rows: leads })

        const result = await crmService.getLeads({ status: LeadStatus.NEW }, { page: 1, limit: 10 })

        expect(result.leads).toHaveLength(2)
        expect(result.total).toBe(2)
        expect(result.page).toBe(1)
        expect(result.limit).toBe(10)
        expect(result.leads[0]).toBeInstanceOf(Lead)
      })

      it("should filter leads by priority", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        await crmService.getLeads({ priority: LeadPriority.HIGH })

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("priority = $1"),
          expect.arrayContaining([LeadPriority.HIGH]),
        )
      })

      it("should filter leads by assignedTo", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        await crmService.getLeads({ assignedTo: "user-123" })

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("assigned_to = $1"),
          expect.arrayContaining(["user-123"]),
        )
      })

      it("should filter leads by customerId", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        await crmService.getLeads({ customerId: "customer-123" })

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("customer_id = $1"),
          expect.arrayContaining(["customer-123"]),
        )
      })

      it("should handle multiple lead filters combined", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] })
        mockQuery.mockResolvedValueOnce({ rows: [mockLeadData] })

        await crmService.getLeads({
          status: LeadStatus.QUALIFIED,
          priority: LeadPriority.HIGH,
          assignedTo: "user-123",
        })

        expect(mockQuery).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe("Analytics", () => {
    describe("calculateCustomerLeadScore", () => {
      it("should calculate lead score based on customer leads", async () => {
        const activeLeads = [
          { ...mockLeadData, status: "new" },
          { ...mockLeadData, id: "lead-456", status: "qualified" },
        ]
        const wonLead = { ...mockLeadData, id: "lead-789", status: "closed_won" }

        mockQuery.mockResolvedValueOnce({
          rows: [...activeLeads, wonLead],
        })

        const score = await crmService.calculateCustomerLeadScore("customer-123")

        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(100)
      })

      it("should return 0 for customer with no leads", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        const score = await crmService.calculateCustomerLeadScore("customer-123")

        expect(score).toBe(0)
      })
    })

    describe("getCRMAnalytics", () => {
      it("should return comprehensive analytics", async () => {
        // Mock all the analytics queries
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "100" }] }) // customers
        mockQuery.mockResolvedValueOnce({ rows: [{ total: "50" }] }) // leads
        mockQuery.mockResolvedValueOnce({ rows: [{ status: "lead", count: "80" }] }) // customers by status
        mockQuery.mockResolvedValueOnce({ rows: [{ status: "new", count: "30" }] }) // leads by status
        mockQuery.mockResolvedValueOnce({ rows: [{ won: "10" }] }) // won leads
        mockQuery.mockResolvedValueOnce({ rows: [{ avg_score: "65.5" }] }) // avg score
        mockQuery.mockResolvedValueOnce({
          rows: [{ sent: "200", delivered: "180", responded: "45" }],
        }) // message stats

        const analytics = await crmService.getCRMAnalytics()

        expect(analytics.totalCustomers).toBe(100)
        expect(analytics.totalLeads).toBe(50)
        expect(analytics.conversionRate).toBe(20) // 10/50 * 100
        expect(analytics.averageLeadScore).toBe(65.5)
        expect(analytics.messagesSent).toBe(200)
        expect(analytics.messagesDelivered).toBe(180)
        expect(analytics.responseRate).toBe(22.5) // 45/200 * 100
      })
    })
  })

  describe("Customer Metrics", () => {
    describe("incrementCustomerInteractions", () => {
      it("should increment customer interaction count", async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await crmService.incrementCustomerInteractions("customer-123")

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("total_interactions = COALESCE(total_interactions, 0) + 1"),
          ["customer-123"],
        )
      })
    })

    describe("updateCustomerLifetimeValue", () => {
      it("should calculate and update customer lifetime value", async () => {
        // Mock payments sum query
        mockQuery.mockResolvedValueOnce({ rows: [{ total_value: "15000.50" }] })
        // Mock customer update query
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await crmService.updateCustomerLifetimeValue("customer-123")

        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT COALESCE(SUM(amount), 0)"), [
          "customer-123",
        ])
        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE customers"),
          expect.arrayContaining([15000.5, "customer-123"]),
        )
      })

      it("should handle customer with no payments", async () => {
        // Mock payments sum query returning 0
        mockQuery.mockResolvedValueOnce({ rows: [{ total_value: "0" }] })
        // Mock customer update query
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await crmService.updateCustomerLifetimeValue("customer-123")

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE customers"),
          expect.arrayContaining([0, "customer-123"]),
        )
      })

      it("should handle missing total_value field", async () => {
        // Mock payments sum query with no result
        mockQuery.mockResolvedValueOnce({ rows: [] })
        // Mock customer update query
        mockQuery.mockResolvedValueOnce({ rows: [] })

        await crmService.updateCustomerLifetimeValue("customer-123")

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE customers"),
          expect.arrayContaining([0, "customer-123"]),
        )
      })
    })

    describe("recalculateAllCustomerMetrics", () => {
      it("should recalculate all customer metrics", async () => {
        // Mock all update queries
        mockQuery.mockResolvedValueOnce({ rows: [] }) // total_interactions
        mockQuery.mockResolvedValueOnce({ rows: [] }) // last_interaction_at
        mockQuery.mockResolvedValueOnce({ rows: [] }) // lifetime_value

        await crmService.recalculateAllCustomerMetrics()

        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("total_interactions ="))
        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("last_interaction_at ="))
        expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("lifetime_value ="))
      })
    })
  })
})
