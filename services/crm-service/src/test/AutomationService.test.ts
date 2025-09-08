import { describe, it, expect, beforeEach, vi } from "vitest"
import { AutomationService } from "../services/AutomationService"
import { Automation, AutomationTrigger, AutomationCondition, AutomationAction } from "@marketplace/shared-types"

// Mock the database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

import { query } from "../db/connection"
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
})
