import { describe, it, expect } from "vitest"
import { Segment, SegmentOperator, SegmentDataType } from "../models/Segment"

describe("Segment Model", () => {
  const mockSegmentData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Test Segment",
    description: "A test segment",
    criteria: [
      {
        field: "status",
        operator: SegmentOperator.EQUALS,
        value: "lead",
        dataType: SegmentDataType.ENUM,
      },
    ],
    operator: "AND" as const,
    is_active: true,
    customer_count: 10,
    last_calculated_at: "2023-01-01T00:00:00Z",
    created_by: "user-123",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }

  describe("Constructor", () => {
    it("should create a segment with all properties", () => {
      const segment = new Segment(mockSegmentData)

      expect(segment.id).toBe(mockSegmentData.id)
      expect(segment.name).toBe(mockSegmentData.name)
      expect(segment.description).toBe(mockSegmentData.description)
      expect(segment.criteria).toEqual(mockSegmentData.criteria)
      expect(segment.operator).toBe(mockSegmentData.operator)
      expect(segment.isActive).toBe(mockSegmentData.is_active)
      expect(segment.customerCount).toBe(mockSegmentData.customer_count)
      expect(segment.lastCalculatedAt).toEqual(new Date(mockSegmentData.last_calculated_at))
      expect(segment.createdBy).toBe(mockSegmentData.created_by)
      expect(segment.createdAt).toEqual(new Date(mockSegmentData.created_at))
      expect(segment.updatedAt).toEqual(new Date(mockSegmentData.updated_at))
    })

    it("should handle JSON string criteria", () => {
      const dataWithJsonCriteria = {
        ...mockSegmentData,
        criteria: JSON.stringify(mockSegmentData.criteria),
      }

      const segment = new Segment(dataWithJsonCriteria)
      expect(segment.criteria).toEqual(mockSegmentData.criteria)
    })

    it("should handle missing optional fields", () => {
      const minimalData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Minimal Segment",
        criteria: [],
        operator: "AND",
        is_active: true,
        created_by: "user-123",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }

      const segment = new Segment(minimalData)
      expect(segment.description).toBeUndefined()
      expect(segment.customerCount).toBeUndefined()
      expect(segment.lastCalculatedAt).toBeUndefined()
    })
  })

  describe("Validation", () => {
    describe("validateCreateRequest", () => {
      it("should pass validation for valid data", () => {
        const validData = {
          name: "Valid Segment",
          description: "A valid segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
          isActive: true,
        }

        const errors = Segment.validateCreateRequest(validData)
        expect(errors).toEqual([])
      })

      it("should fail validation for missing name", () => {
        const invalidData = {
          name: "",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
        }

        const errors = Segment.validateCreateRequest(invalidData)
        expect(errors).toContain("Name is required")
      })

      it("should fail validation for long name", () => {
        const invalidData = {
          name: "a".repeat(256),
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
        }

        const errors = Segment.validateCreateRequest(invalidData)
        expect(errors).toContain("Name must be less than 255 characters")
      })

      it("should fail validation for empty criteria", () => {
        const invalidData = {
          name: "Test Segment",
          criteria: [],
          operator: "AND" as const,
        }

        const errors = Segment.validateCreateRequest(invalidData)
        expect(errors).toContain("At least one criteria is required")
      })

      it("should fail validation for invalid operator", () => {
        const invalidData = {
          name: "Test Segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "INVALID" as any,
        }

        const errors = Segment.validateCreateRequest(invalidData)
        expect(errors).toContain("Operator must be either 'AND' or 'OR'")
      })
    })

    describe("validateCriteria", () => {
      it("should pass validation for valid criteria", () => {
        const validCriteria = {
          field: "status",
          operator: SegmentOperator.EQUALS,
          value: "lead",
          dataType: SegmentDataType.ENUM,
        }

        const errors = Segment.validateCriteria(validCriteria)
        expect(errors).toEqual([])
      })

      it("should fail validation for missing field", () => {
        const invalidCriteria = {
          field: "",
          operator: SegmentOperator.EQUALS,
          value: "lead",
          dataType: SegmentDataType.ENUM,
        }

        const errors = Segment.validateCriteria(invalidCriteria)
        expect(errors).toContain("Field is required")
      })

      it("should fail validation for invalid operator", () => {
        const invalidCriteria = {
          field: "status",
          operator: "INVALID" as any,
          value: "lead",
          dataType: SegmentDataType.ENUM,
        }

        const errors = Segment.validateCriteria(invalidCriteria)
        expect(errors).toContain("Invalid operator")
      })

      it("should fail validation for missing value when required", () => {
        const invalidCriteria = {
          field: "status",
          operator: SegmentOperator.EQUALS,
          value: null,
          dataType: SegmentDataType.ENUM,
        }

        const errors = Segment.validateCriteria(invalidCriteria)
        expect(errors).toContain("Value is required for this operator")
      })

      it("should pass validation for IS_NULL operator without value", () => {
        const validCriteria = {
          field: "description",
          operator: SegmentOperator.IS_NULL,
          value: null,
          dataType: SegmentDataType.STRING,
        }

        const errors = Segment.validateCriteria(validCriteria)
        expect(errors).toEqual([])
      })

      it("should fail validation for IN operator with non-array value", () => {
        const invalidCriteria = {
          field: "status",
          operator: SegmentOperator.IN,
          value: "lead",
          dataType: SegmentDataType.ENUM,
        }

        const errors = Segment.validateCriteria(invalidCriteria)
        expect(errors).toContain("Value must be an array for IN/NOT_IN operators")
      })

      it("should fail validation for BETWEEN operator with invalid array", () => {
        const invalidCriteria = {
          field: "leadScore",
          operator: SegmentOperator.BETWEEN,
          value: [50],
          dataType: SegmentDataType.NUMBER,
        }

        const errors = Segment.validateCriteria(invalidCriteria)
        expect(errors).toContain("Value must be an array with exactly 2 elements for BETWEEN operator")
      })
    })
  })

  describe("getAvailableFields", () => {
    it("should return available fields for segmentation", () => {
      const fields = Segment.getAvailableFields()

      expect(fields).toBeInstanceOf(Array)
      expect(fields.length).toBeGreaterThan(0)

      // Check that essential fields are present
      const fieldKeys = fields.map((f) => f.key)
      expect(fieldKeys).toContain("firstName")
      expect(fieldKeys).toContain("lastName")
      expect(fieldKeys).toContain("email")
      expect(fieldKeys).toContain("status")
      expect(fieldKeys).toContain("leadScore")
      expect(fieldKeys).toContain("tags")
      expect(fieldKeys).toContain("totalInteractions")
      expect(fieldKeys).toContain("lifetimeValue")
      expect(fieldKeys).toContain("createdAt")
      expect(fieldKeys).toContain("lastInteractionAt")

      // Check field structure
      const firstField = fields[0]
      expect(firstField).toHaveProperty("key")
      expect(firstField).toHaveProperty("label")
      expect(firstField).toHaveProperty("dataType")
      expect(firstField).toHaveProperty("operators")
      expect(firstField.operators).toBeInstanceOf(Array)
    })

    it("should include enum options for enum fields", () => {
      const fields = Segment.getAvailableFields()
      const statusField = fields.find((f) => f.key === "status")

      expect(statusField).toBeDefined()
      expect(statusField?.dataType).toBe(SegmentDataType.ENUM)
      expect(statusField?.options).toBeInstanceOf(Array)
      expect(statusField?.options?.length).toBeGreaterThan(0)
    })
  })

  describe("Serialization", () => {
    it("should convert to database format", () => {
      const segment = new Segment(mockSegmentData)
      const dbFormat = segment.toDatabaseFormat()

      expect(dbFormat.id).toBe(segment.id)
      expect(dbFormat.name).toBe(segment.name)
      expect(dbFormat.description).toBe(segment.description)
      expect(dbFormat.criteria).toBe(JSON.stringify(segment.criteria))
      expect(dbFormat.operator).toBe(segment.operator)
      expect(dbFormat.is_active).toBe(segment.isActive)
      expect(dbFormat.customer_count).toBe(segment.customerCount)
      expect(dbFormat.last_calculated_at).toBe(segment.lastCalculatedAt)
      expect(dbFormat.created_by).toBe(segment.createdBy)
      expect(dbFormat.created_at).toBe(segment.createdAt)
      expect(dbFormat.updated_at).toBe(segment.updatedAt)
    })

    it("should convert to JSON format", () => {
      const segment = new Segment(mockSegmentData)
      const jsonFormat = segment.toJSON()

      expect(jsonFormat.id).toBe(segment.id)
      expect(jsonFormat.name).toBe(segment.name)
      expect(jsonFormat.description).toBe(segment.description)
      expect(jsonFormat.criteria).toEqual(segment.criteria)
      expect(jsonFormat.operator).toBe(segment.operator)
      expect(jsonFormat.isActive).toBe(segment.isActive)
      expect(jsonFormat.customerCount).toBe(segment.customerCount)
      expect(jsonFormat.lastCalculatedAt).toBe(segment.lastCalculatedAt)
      expect(jsonFormat.createdBy).toBe(segment.createdBy)
      expect(jsonFormat.createdAt).toBe(segment.createdAt)
      expect(jsonFormat.updatedAt).toBe(segment.updatedAt)
    })
  })
})
