import { describe, it, expect } from "vitest"
import { Template } from "../models/Template"
import { CommunicationChannel } from "@marketplace/shared-types"

describe("Template Model", () => {
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

  describe("Constructor", () => {
    it("should create a template instance with all properties", () => {
      const template = new Template(mockTemplateData)

      expect(template.id).toBe(mockTemplateData.id)
      expect(template.name).toBe(mockTemplateData.name)
      expect(template.type).toBe(mockTemplateData.type)
      expect(template.category).toBe(mockTemplateData.category)
      expect(template.subject).toBe(mockTemplateData.subject)
      expect(template.content).toBe(mockTemplateData.content)
      expect(template.variables).toEqual(mockTemplateData.variables)
      expect(template.conditions).toEqual(mockTemplateData.conditions)
      expect(template.isActive).toBe(mockTemplateData.is_active)
      expect(template.createdBy).toBe(mockTemplateData.created_by)
      expect(template.createdAt).toEqual(new Date(mockTemplateData.created_at))
      expect(template.updatedAt).toEqual(new Date(mockTemplateData.updated_at))
    })

    it("should handle JSON string variables", () => {
      const dataWithStringVariables = {
        ...mockTemplateData,
        variables: JSON.stringify(["firstName", "lastName"]),
      }

      const template = new Template(dataWithStringVariables)

      expect(template.variables).toEqual(["firstName", "lastName"])
    })

    it("should handle JSON string conditions", () => {
      const dataWithStringConditions = {
        ...mockTemplateData,
        conditions: JSON.stringify({ triggers: ["new_customer"] }),
      }

      const template = new Template(dataWithStringConditions)

      expect(template.conditions).toEqual({ triggers: ["new_customer"] })
    })

    it("should use default values for missing properties", () => {
      const minimalData = {
        id: "123",
        name: "test",
        type: "email",
        category: "test",
        content: "test content",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }

      const template = new Template(minimalData)

      expect(template.variables).toEqual([])
      expect(template.conditions).toEqual({})
      expect(template.isActive).toBe(true)
    })
  })

  describe("Validation Methods", () => {
    describe("validateCreateRequest", () => {
      it("should return no errors for valid data", () => {
        const validData = {
          name: "test_template",
          type: CommunicationChannel.EMAIL,
          category: "welcome",
          subject: "Test Subject",
          content: "Test content",
          variables: ["firstName"],
        }

        const errors = Template.validateCreateRequest(validData)

        expect(errors).toEqual([])
      })

      it("should return errors for missing required fields", () => {
        const invalidData = {
          name: "",
          type: CommunicationChannel.EMAIL,
          category: "",
          content: "",
        }

        const errors = Template.validateCreateRequest(invalidData)

        expect(errors).toContain("Name is required")
        expect(errors).toContain("Category is required")
        expect(errors).toContain("Content is required")
      })

      it("should require subject for email templates", () => {
        const emailTemplateWithoutSubject = {
          name: "test_template",
          type: CommunicationChannel.EMAIL,
          category: "welcome",
          content: "Test content",
        }

        const errors = Template.validateCreateRequest(emailTemplateWithoutSubject)

        expect(errors).toContain("Subject is required for email templates")
      })

      it("should not require subject for non-email templates", () => {
        const telegramTemplate = {
          name: "test_template",
          type: CommunicationChannel.TELEGRAM,
          category: "welcome",
          content: "Test content",
        }

        const errors = Template.validateCreateRequest(telegramTemplate)

        expect(errors).not.toContain("Subject is required for email templates")
      })

      it("should validate variables format", () => {
        const invalidVariables = {
          name: "test_template",
          type: CommunicationChannel.EMAIL,
          category: "welcome",
          subject: "Test",
          content: "Test content",
          variables: "invalid" as any,
        }

        const errors = Template.validateCreateRequest(invalidVariables)

        expect(errors).toContain("Variables must be an array")
      })
    })

    describe("validateUpdateRequest", () => {
      it("should return no errors for valid update data", () => {
        const validUpdateData = {
          name: "updated_template",
          content: "Updated content",
        }

        const errors = Template.validateUpdateRequest(validUpdateData)

        expect(errors).toEqual([])
      })

      it("should return errors for empty values", () => {
        const invalidUpdateData = {
          name: "",
          content: "",
          category: "",
        }

        const errors = Template.validateUpdateRequest(invalidUpdateData)

        expect(errors).toContain("Name cannot be empty")
        expect(errors).toContain("Content cannot be empty")
        expect(errors).toContain("Category cannot be empty")
      })
    })
  })

  describe("Business Logic Methods", () => {
    describe("extractVariables", () => {
      it("should extract variables from content", () => {
        const template = new Template({
          ...mockTemplateData,
          content: "Hello {{firstName}} {{lastName}}, your order {{orderId}} is ready!",
        })

        const variables = template.extractVariables()

        expect(variables).toEqual(expect.arrayContaining(["firstName", "lastName", "orderId"]))
      })

      it("should extract variables from subject", () => {
        const template = new Template({
          ...mockTemplateData,
          subject: "Welcome {{firstName}}!",
          content: "Hello {{lastName}}",
        })

        const variables = template.extractVariables()

        expect(variables).toEqual(expect.arrayContaining(["firstName", "lastName"]))
      })

      it("should ignore Handlebars helpers", () => {
        const template = new Template({
          ...mockTemplateData,
          content: "Hello {{firstName}}! {{#if company}}You work at {{company}}.{{/if}}",
        })

        const variables = template.extractVariables()

        expect(variables).toEqual(expect.arrayContaining(["firstName", "company"]))
        expect(variables).not.toContain("#if")
        expect(variables).not.toContain("/if")
      })

      it("should return unique variables", () => {
        const template = new Template({
          ...mockTemplateData,
          content: "Hello {{firstName}} {{firstName}}, welcome {{firstName}}!",
        })

        const variables = template.extractVariables()

        expect(variables).toEqual(["firstName"])
      })
    })

    describe("matchesConditions", () => {
      it("should return true for empty conditions", () => {
        const template = new Template({
          ...mockTemplateData,
          conditions: {},
        })

        const context = { trigger: "any_trigger" }

        expect(template.matchesConditions(context)).toBe(true)
      })

      it("should match trigger conditions", () => {
        const template = new Template({
          ...mockTemplateData,
          conditions: { triggers: ["new_customer", "registration"] },
        })

        const context1 = { trigger: "new_customer" }
        const context2 = { trigger: "follow_up" }

        expect(template.matchesConditions(context1)).toBe(true)
        expect(template.matchesConditions(context2)).toBe(false)
      })

      it("should match customer segment conditions", () => {
        const template = new Template({
          ...mockTemplateData,
          conditions: { customerSegment: ["vip", "premium"] },
        })

        const context1 = { customer: { tags: ["vip", "active"] } }
        const context2 = { customer: { tags: ["basic", "active"] } }

        expect(template.matchesConditions(context1)).toBe(true)
        expect(template.matchesConditions(context2)).toBe(false)
      })

      it("should match lead status conditions", () => {
        const template = new Template({
          ...mockTemplateData,
          conditions: { leadStatus: ["new", "qualified"] },
        })

        const context1 = { lead: { status: "new" } }
        const context2 = { lead: { status: "closed" } }

        expect(template.matchesConditions(context1)).toBe(true)
        expect(template.matchesConditions(context2)).toBe(false)
      })

      it("should match time constraint conditions", () => {
        const template = new Template({
          ...mockTemplateData,
          conditions: {
            timeConstraints: {
              daysSinceLastContact: 3,
            },
          },
        })

        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 4)

        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        const context1 = { customer: { lastInteractionAt: threeDaysAgo.toISOString() } }
        const context2 = { customer: { lastInteractionAt: oneDayAgo.toISOString() } }

        expect(template.matchesConditions(context1)).toBe(true)
        expect(template.matchesConditions(context2)).toBe(false)
      })
    })
  })

  describe("Serialization Methods", () => {
    describe("toDatabaseFormat", () => {
      it("should convert to database format", () => {
        const template = new Template(mockTemplateData)

        const dbFormat = template.toDatabaseFormat()

        expect(dbFormat.id).toBe(template.id)
        expect(dbFormat.name).toBe(template.name)
        expect(dbFormat.variables).toBe(JSON.stringify(template.variables))
        expect(dbFormat.conditions).toBe(JSON.stringify(template.conditions))
        expect(dbFormat.is_active).toBe(template.isActive)
        expect(dbFormat.created_by).toBe(template.createdBy)
      })
    })

    describe("toJSON", () => {
      it("should convert to API response format", () => {
        const template = new Template(mockTemplateData)

        const jsonFormat = template.toJSON()

        expect(jsonFormat.id).toBe(template.id)
        expect(jsonFormat.name).toBe(template.name)
        expect(jsonFormat.variables).toEqual(template.variables)
        expect(jsonFormat.conditions).toEqual(template.conditions)
        expect(jsonFormat.isActive).toBe(template.isActive)
        expect(jsonFormat.createdBy).toBe(template.createdBy)
      })
    })
  })
})
