import { describe, it, expect, beforeEach, vi } from "vitest"
import { TemplateService } from "../services/TemplateService"
import { Template } from "../models/Template"
import { CommunicationChannel } from "@marketplace/shared-types"

// Mock the database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

import { query } from "../db/connection"
const mockQuery = vi.mocked(query)

describe("TemplateService", () => {
  let templateService: TemplateService

  beforeEach(() => {
    templateService = new TemplateService()
    vi.clearAllMocks()
  })

  const mockTemplateData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "test_template",
    type: "email",
    category: "welcome",
    subject: "Welcome {{firstName}}!",
    content: "Hello {{firstName}} {{lastName}}, welcome to our platform!",
    variables: ["firstName", "lastName"],
    conditions: { triggers: ["new_customer"] },
    is_active: true,
    created_by: "user-123",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }

  describe("createTemplate", () => {
    it("should create a template successfully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Check existing template
        .mockResolvedValueOnce({ rows: [mockTemplateData] }) // Insert template

      const createData = {
        name: "test_template",
        type: CommunicationChannel.EMAIL,
        category: "welcome",
        subject: "Welcome {{firstName}}!",
        content: "Hello {{firstName}} {{lastName}}, welcome to our platform!",
        variables: ["firstName", "lastName"],
        conditions: { triggers: ["new_customer"] },
      }

      const result = await templateService.createTemplate(createData)

      expect(result).toBeInstanceOf(Template)
      expect(result.name).toBe(createData.name)
      expect(mockQuery).toHaveBeenCalledTimes(2)
    })

    it("should throw error if template name already exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockTemplateData] })

      const createData = {
        name: "test_template",
        type: CommunicationChannel.EMAIL,
        category: "welcome",
        subject: "Test Subject", // Add required subject for email templates
        content: "Test content",
      }

      await expect(templateService.createTemplate(createData)).rejects.toThrow("Template with this name already exists")
    })

    it("should throw validation error for invalid data", async () => {
      const invalidData = {
        name: "",
        type: CommunicationChannel.EMAIL,
        category: "welcome",
        content: "",
      }

      await expect(templateService.createTemplate(invalidData)).rejects.toThrow("Validation failed")
    })
  })

  describe("getTemplateById", () => {
    it("should return template when found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockTemplateData] })

      const result = await templateService.getTemplateById("123e4567-e89b-12d3-a456-426614174000")

      expect(result).toBeInstanceOf(Template)
      expect(result?.id).toBe(mockTemplateData.id)
    })

    it("should return null when template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await templateService.getTemplateById("non-existent-id")

      expect(result).toBeNull()
    })
  })

  describe("getTemplates", () => {
    it("should return templates with pagination", async () => {
      const mockTemplates = [mockTemplateData]
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "1" }] }) // Count query
        .mockResolvedValueOnce({ rows: mockTemplates }) // Templates query

      const result = await templateService.getTemplates({ limit: 10, offset: 0 })

      expect(result.total).toBe(1)
      expect(result.templates).toHaveLength(1)
      expect(result.templates[0]).toBeInstanceOf(Template)
    })

    it("should filter templates by type", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "1" }] }).mockResolvedValueOnce({ rows: [mockTemplateData] })

      const result = await templateService.getTemplates({ type: CommunicationChannel.EMAIL })

      expect(result.templates).toHaveLength(1)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE type = $1"),
        expect.arrayContaining([CommunicationChannel.EMAIL]),
      )
    })
  })

  describe("updateTemplate", () => {
    it("should update template successfully", async () => {
      const updatedData = { ...mockTemplateData, name: "updated_template" }
      mockQuery.mockResolvedValueOnce({ rows: [updatedData] })

      const result = await templateService.updateTemplate("123e4567-e89b-12d3-a456-426614174000", {
        name: "updated_template",
      })

      expect(result).toBeInstanceOf(Template)
      expect(result?.name).toBe("updated_template")
    })

    it("should return null when template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await templateService.updateTemplate("non-existent-id", {
        name: "updated_template",
      })

      expect(result).toBeNull()
    })
  })

  describe("deleteTemplate", () => {
    it("should delete template successfully", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      const result = await templateService.deleteTemplate("123e4567-e89b-12d3-a456-426614174000")

      expect(result).toBe(true)
    })

    it("should return false when template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 })

      const result = await templateService.deleteTemplate("non-existent-id")

      expect(result).toBe(false)
    })
  })

  describe("renderTemplate", () => {
    it("should render template with variables", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockTemplateData] })

      const context = {
        firstName: "John",
        lastName: "Doe",
        customer: { firstName: "John", lastName: "Doe" },
      }

      const result = await templateService.renderTemplate("123e4567-e89b-12d3-a456-426614174000", context)

      expect(result.subject).toBe("Welcome John!")
      expect(result.content).toBe("Hello John Doe, welcome to our platform!")
      expect(result.variables).toEqual({ firstName: "John", lastName: "Doe" })
    })

    it("should handle conditional blocks", async () => {
      const templateWithCondition = {
        ...mockTemplateData,
        content: "Hello {{firstName}}! {{#if company}}You work at {{company}}.{{/if}}",
        variables: ["firstName", "company"],
      }
      mockQuery.mockResolvedValueOnce({ rows: [templateWithCondition] })

      const context = {
        firstName: "John",
        company: "Acme Corp",
      }

      const result = await templateService.renderTemplate("123e4567-e89b-12d3-a456-426614174000", context)

      expect(result.content).toBe("Hello John! You work at Acme Corp.")
    })

    it("should handle missing conditional variables", async () => {
      const templateWithCondition = {
        ...mockTemplateData,
        content: "Hello {{firstName}}! {{#if company}}You work at {{company}}.{{/if}}",
        variables: ["firstName", "company"],
      }
      mockQuery.mockResolvedValueOnce({ rows: [templateWithCondition] })

      const context = {
        firstName: "John",
        // company is missing
      }

      const result = await templateService.renderTemplate("123e4567-e89b-12d3-a456-426614174000", context)

      expect(result.content).toBe("Hello John! ")
    })

    it("should throw error for inactive template", async () => {
      const inactiveTemplate = { ...mockTemplateData, is_active: false }
      mockQuery.mockResolvedValueOnce({ rows: [inactiveTemplate] })

      const context = { firstName: "John" }

      await expect(templateService.renderTemplate("123e4567-e89b-12d3-a456-426614174000", context)).rejects.toThrow(
        "Template is not active",
      )
    })

    it("should throw error for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const context = { firstName: "John" }

      await expect(templateService.renderTemplate("non-existent-id", context)).rejects.toThrow("Template not found")
    })
  })

  describe("findMatchingTemplates", () => {
    it("should find templates matching conditions", async () => {
      const template1 = { ...mockTemplateData, conditions: { triggers: ["new_customer"] } }
      const template2 = {
        ...mockTemplateData,
        id: "template-2",
        conditions: { triggers: ["follow_up"] },
      }

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total: "2" }],
        })
        .mockResolvedValueOnce({
          rows: [template1, template2],
        })

      const context = { trigger: "new_customer" }

      const result = await templateService.findMatchingTemplates(CommunicationChannel.EMAIL, "welcome", context)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(template1.id)
    })
  })

  describe("getTemplateStats", () => {
    it("should return template statistics", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "10" }] }) // Total templates
        .mockResolvedValueOnce({ rows: [{ total: "8" }] }) // Active templates
        .mockResolvedValueOnce({
          rows: [
            { type: "email", count: "5" },
            { type: "telegram", count: "3" },
          ],
        }) // By type
        .mockResolvedValueOnce({
          rows: [
            { category: "welcome", count: "4" },
            { category: "follow_up", count: "4" },
          ],
        }) // By category

      const result = await templateService.getTemplateStats()

      expect(result.totalTemplates).toBe(10)
      expect(result.activeTemplates).toBe(8)
      expect(result.templatesByType).toEqual({ email: 5, telegram: 3 })
      expect(result.templatesByCategory).toEqual({ welcome: 4, follow_up: 4 })
    })
  })
})
