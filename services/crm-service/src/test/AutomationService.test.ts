import { Automation } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { query } from "../db/connection"
import { AutomationService } from "../services/AutomationService"

// Mock the database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

// Mock TemplateService
vi.mock("../services/TemplateService", () => ({
  TemplateService: class {
    renderTemplate = vi.fn().mockResolvedValue({
      content: "Rendered content",
      subject: "Rendered subject",
    })
    renderTemplateByName = vi.fn().mockResolvedValue({
      content: "Rendered content by name",
      subject: "Rendered subject by name",
    })
  },
}))

const mockQuery = vi.mocked(query)

describe("AutomationService", () => {
  let automationService: AutomationService

  beforeEach(() => {
    automationService = new AutomationService()
    vi.clearAllMocks()
  })

  describe("triggerWorkflow", () => {
    it("should trigger workflow successfully when automations exist", async () => {
      const mockAutomation: Automation = {
        id: "automation-1",
        name: "New Lead Welcome",
        description: "Send welcome message to new leads",
        trigger: {
          type: "lead_created",
          conditions: [],
        },
        conditions: [],
        actions: [
          {
            type: "send_message",
            parameters: {
              channel: "email",
              content: "Welcome!",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockAutomation.id,
            name: mockAutomation.name,
            description: mockAutomation.description,
            trigger: mockAutomation.trigger,
            conditions: mockAutomation.conditions,
            actions: mockAutomation.actions,
            is_active: mockAutomation.isActive,
            created_by: mockAutomation.createdBy,
            created_at: mockAutomation.createdAt,
            updated_at: mockAutomation.updatedAt,
          },
        ],
      })

      await expect(
        automationService.triggerWorkflow("lead_created", {
          leadId: "lead-1",
          customerId: "customer-1",
        }),
      ).resolves.not.toThrow()

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM automations"), ["lead_created"])
    })

    it("should handle no automations found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await expect(automationService.triggerWorkflow("unknown_event", {})).resolves.not.toThrow()
    })

    it("should handle database errors gracefully", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"))

      await expect(automationService.triggerWorkflow("lead_created", {})).resolves.not.toThrow()
    })
  })

  describe("createAutomation", () => {
    it("should create automation successfully", async () => {
      const automationData: Omit<Automation, "id" | "createdAt" | "updatedAt"> = {
        name: "Test Automation",
        description: "Test description",
        trigger: {
          type: "lead_created",
          conditions: [],
        },
        conditions: [],
        actions: [
          {
            type: "send_message",
            parameters: { content: "Test message" },
          },
        ],
        isActive: true,
        createdBy: "user-1",
      }

      const mockResult = {
        rows: [
          {
            id: "automation-1",
            name: automationData.name,
            description: automationData.description,
            trigger: automationData.trigger,
            conditions: automationData.conditions,
            actions: automationData.actions,
            is_active: automationData.isActive,
            created_by: automationData.createdBy,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      }

      mockQuery.mockResolvedValueOnce(mockResult)

      const result = await automationService.createAutomation(automationData)

      expect(result).toMatchObject({
        id: "automation-1",
        name: automationData.name,
        description: automationData.description,
        isActive: automationData.isActive,
        createdBy: automationData.createdBy,
      })

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO automations"), [
        automationData.name,
        automationData.description,
        JSON.stringify(automationData.trigger),
        JSON.stringify(automationData.conditions),
        JSON.stringify(automationData.actions),
        automationData.isActive,
        automationData.createdBy,
      ])
    })
  })

  describe("getAutomationById", () => {
    it("should return automation when found", async () => {
      const mockAutomation = {
        id: "automation-1",
        name: "Test Automation",
        description: "Test description",
        trigger: { type: "lead_created" },
        conditions: [],
        actions: [],
        is_active: true,
        created_by: "user-1",
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockAutomation] })

      const result = await automationService.getAutomationById("automation-1")

      expect(result).toMatchObject({
        id: mockAutomation.id,
        name: mockAutomation.name,
        description: mockAutomation.description,
        isActive: mockAutomation.is_active,
        createdBy: mockAutomation.created_by,
      })

      expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM automations WHERE id = $1", ["automation-1"])
    })

    it("should return null when automation not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await automationService.getAutomationById("nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("getAutomations", () => {
    it("should return all automations when no filters", async () => {
      const mockAutomations = [
        {
          id: "automation-1",
          name: "Test 1",
          description: "Description 1",
          trigger: { type: "lead_created" },
          conditions: [],
          actions: [],
          is_active: true,
          created_by: "user-1",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockAutomations })

      const result = await automationService.getAutomations()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: "automation-1",
        name: "Test 1",
        isActive: true,
      })

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM automations WHERE 1=1"), [])
    })

    it("should filter by isActive when provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await automationService.getAutomations({ isActive: true })

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("AND is_active = $1"), [true])
    })
  })

  describe("condition evaluation", () => {
    it("should evaluate conditions correctly", async () => {
      const mockAutomation: Automation = {
        id: "automation-1",
        name: "Conditional Automation",
        description: "Test conditional automation",
        trigger: {
          type: "lead_created",
          conditions: [],
        },
        conditions: [
          {
            field: "priority",
            operator: "equals",
            value: "high",
          },
        ],
        actions: [
          {
            type: "send_message",
            parameters: { content: "High priority lead!" },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockAutomation.id,
            name: mockAutomation.name,
            description: mockAutomation.description,
            trigger: mockAutomation.trigger,
            conditions: mockAutomation.conditions,
            actions: mockAutomation.actions,
            is_active: mockAutomation.isActive,
            created_by: mockAutomation.createdBy,
            created_at: mockAutomation.createdAt,
            updated_at: mockAutomation.updatedAt,
          },
        ],
      })

      // Should trigger for high priority lead
      await expect(
        automationService.triggerWorkflow("lead_created", {
          leadId: "lead-1",
          priority: "high",
        }),
      ).resolves.not.toThrow()

      // Should not trigger for low priority lead (but won't throw)
      await expect(
        automationService.triggerWorkflow("lead_created", {
          leadId: "lead-2",
          priority: "low",
        }),
      ).resolves.not.toThrow()
    })
  })

  describe("condition operators", () => {
    const createMockAutomation = (operator: string, value: any): Automation => ({
      id: "automation-1",
      name: "Test Automation",
      description: "Test",
      trigger: { type: "test_event", conditions: [] },
      conditions: [{ field: "testField", operator, value }],
      actions: [{ type: "send_message", parameters: { content: "Test" } }],
      isActive: true,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    it("should evaluate not_equals operator", async () => {
      const automation = createMockAutomation("not_equals", "value1")
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: "value2" })
      expect(mockQuery).toHaveBeenCalled()
    })

    it("should evaluate contains operator", async () => {
      const automation = createMockAutomation("contains", "test")
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: "this is a test string" })
      expect(mockQuery).toHaveBeenCalled()
    })

    it("should evaluate greater_than operator", async () => {
      const automation = createMockAutomation("greater_than", 10)
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: 15 })
      expect(mockQuery).toHaveBeenCalled()
    })

    it("should evaluate less_than operator", async () => {
      const automation = createMockAutomation("less_than", 100)
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: 50 })
      expect(mockQuery).toHaveBeenCalled()
    })

    it("should evaluate in operator", async () => {
      const automation = createMockAutomation("in", ["value1", "value2", "value3"])
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: "value2" })
      expect(mockQuery).toHaveBeenCalled()
    })

    it("should evaluate not_in operator", async () => {
      const automation = createMockAutomation("not_in", ["value1", "value2"])
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: "value3" })
      expect(mockQuery).toHaveBeenCalled()
    })

    it("should handle unknown operator", async () => {
      const automation = createMockAutomation("unknown_operator", "value")
      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", { testField: "value" })
      expect(mockQuery).toHaveBeenCalled()
    })
  })

  describe("nested field access", () => {
    it("should access nested fields in data", async () => {
      const automation: Automation = {
        id: "automation-1",
        name: "Nested Field Test",
        description: "Test",
        trigger: { type: "test_event", conditions: [] },
        conditions: [{ field: "customer.status", operator: "equals", value: "active" }],
        actions: [{ type: "send_message", parameters: { content: "Test" } }],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValue({ rows: [automation] })

      await automationService.triggerWorkflow("test_event", {
        customer: { status: "active", name: "John" },
      })

      expect(mockQuery).toHaveBeenCalled()
    })
  })

  describe("action execution", () => {
    it("should execute update_lead action", async () => {
      const automation: Automation = {
        id: "automation-1",
        name: "Update Lead",
        description: "Test",
        trigger: { type: "lead_created", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "update_lead",
            parameters: {
              status: "qualified",
              priority: "high",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [automation] }) // getAutomationsByTrigger
        .mockResolvedValueOnce({ rows: [] }) // UPDATE leads

      await automationService.triggerWorkflow("lead_created", { leadId: "lead-123" })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE leads"),
        expect.arrayContaining(["qualified", "high", "lead-123"]),
      )
    })

    it("should execute assign_lead action", async () => {
      const automation: Automation = {
        id: "automation-1",
        name: "Assign Lead",
        description: "Test",
        trigger: { type: "lead_created", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "assign_lead",
            parameters: {
              assignedTo: "user-456",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [automation] }) // getAutomationsByTrigger
        .mockResolvedValueOnce({ rows: [] }) // UPDATE leads

      await automationService.triggerWorkflow("lead_created", { leadId: "lead-123" })

      expect(mockQuery).toHaveBeenCalledWith("UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2", [
        "user-456",
        "lead-123",
      ])
    })

    it("should execute create_task action", async () => {
      const automation: Automation = {
        id: "automation-1",
        name: "Create Task",
        description: "Test",
        trigger: { type: "lead_created", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "create_task",
            parameters: {
              title: "Follow up",
              description: "Contact the lead",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [automation] })

      await automationService.triggerWorkflow("lead_created", { leadId: "lead-123" })

      expect(mockQuery).toHaveBeenCalled()
    })

    it("should execute webhook action successfully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      })

      const automation: Automation = {
        id: "automation-1",
        name: "Webhook Action",
        description: "Test",
        trigger: { type: "lead_created", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "webhook",
            parameters: {
              url: "https://example.com/webhook",
              method: "POST",
              headers: { "X-Custom": "header" },
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [automation] })

      await automationService.triggerWorkflow("lead_created", { leadId: "lead-123" })

      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Custom": "header",
          }),
        }),
      )
    })

    it("should handle webhook action failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })

      const automation: Automation = {
        id: "automation-1",
        name: "Webhook Action",
        description: "Test",
        trigger: { type: "lead_created", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "webhook",
            parameters: {
              url: "https://example.com/webhook",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [automation] })

      await expect(automationService.triggerWorkflow("lead_created", { leadId: "lead-123" })).rejects.toThrow()
    })

    it("should handle send_message action without customerId", async () => {
      const automation: Automation = {
        id: "automation-1",
        name: "Send Message",
        description: "Test",
        trigger: { type: "test_event", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "send_message",
            parameters: {
              content: "Test message",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [automation] })

      // Should not throw even without customerId
      await expect(automationService.triggerWorkflow("test_event", {})).resolves.not.toThrow()
    })

    it("should execute send_message action with template", async () => {
      const automation: Automation = {
        id: "automation-1",
        name: "Send Message with Template",
        description: "Test",
        trigger: { type: "test_event", conditions: [] },
        conditions: [],
        actions: [
          {
            type: "send_message",
            parameters: {
              customerId: "customer-123",
              templateId: "template-123",
              channel: "email",
            },
          },
        ],
        isActive: true,
        createdBy: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [automation] }) // getAutomationsByTrigger
        .mockResolvedValueOnce({ rows: [{ id: "customer-123", name: "John" }] }) // get customer
        .mockResolvedValueOnce({ rows: [{ id: "lead-123", status: "new" }] }) // get lead

      await automationService.triggerWorkflow("test_event", { customerId: "customer-123", leadId: "lead-123" })

      expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM customers WHERE id = $1", ["customer-123"])
    })
  })

  describe("initialize", () => {
    it("should initialize and create default automations", async () => {
      // Mock checking for existing automations
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // New Lead Welcome doesn't exist
        .mockResolvedValueOnce({ rows: [{ id: "automation-1" }] }) // Insert New Lead Welcome
        .mockResolvedValueOnce({ rows: [] }) // Lead Follow-up doesn't exist
        .mockResolvedValueOnce({ rows: [{ id: "automation-2" }] }) // Insert Lead Follow-up

      await automationService.initialize()

      expect(mockQuery).toHaveBeenCalledWith("SELECT id FROM automations WHERE name = $1", ["New Lead Welcome"])
      expect(mockQuery).toHaveBeenCalledWith("SELECT id FROM automations WHERE name = $1", ["Lead Follow-up"])
    })

    it("should not create automations if they already exist", async () => {
      // Mock that automations already exist
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "existing-1" }] }) // New Lead Welcome exists
        .mockResolvedValueOnce({ rows: [{ id: "existing-2" }] }) // Lead Follow-up exists

      await automationService.initialize()

      // Should only check for existence, not create
      expect(mockQuery).toHaveBeenCalledTimes(2)
    })

    it("should handle initialization errors gracefully", async () => {
      mockQuery.mockRejectedValue(new Error("Database error"))

      await expect(automationService.initialize()).resolves.not.toThrow()
    })
  })
})
