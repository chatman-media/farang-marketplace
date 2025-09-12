import { CommunicationChannel, CustomerStatus } from "@marketplace/shared-types"

export interface ISegment {
  id: string
  name: string
  description?: string
  criteria: SegmentCriteria[]
  operator: "AND" | "OR"
  isActive: boolean
  customerCount?: number
  lastCalculatedAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface SegmentCriteria {
  field: string
  operator: SegmentOperator
  value: any
  dataType: SegmentDataType
}

export enum SegmentOperator {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  CONTAINS = "contains",
  NOT_CONTAINS = "not_contains",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
  GREATER_THAN = "greater_than",
  GREATER_THAN_OR_EQUAL = "greater_than_or_equal",
  LESS_THAN = "less_than",
  LESS_THAN_OR_EQUAL = "less_than_or_equal",
  IN = "in",
  NOT_IN = "not_in",
  IS_NULL = "is_null",
  IS_NOT_NULL = "is_not_null",
  BETWEEN = "between",
  REGEX = "regex",
  DATE_BEFORE = "date_before",
  DATE_AFTER = "date_after",
  DATE_BETWEEN = "date_between",
  DAYS_AGO = "days_ago",
  HAS_TAG = "has_tag",
  NOT_HAS_TAG = "not_has_tag",
}

export enum SegmentDataType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  ARRAY = "array",
  ENUM = "enum",
}

export interface CreateSegmentRequest {
  name: string
  description?: string
  criteria: SegmentCriteria[]
  operator: "AND" | "OR"
  isActive?: boolean
}

export interface UpdateSegmentRequest {
  name?: string
  description?: string
  criteria?: SegmentCriteria[]
  operator?: "AND" | "OR"
  isActive?: boolean
}

export interface SegmentField {
  key: string
  label: string
  dataType: SegmentDataType
  operators: SegmentOperator[]
  options?: { value: any; label: string }[] // For enum fields
}

export class Segment implements ISegment {
  id: string
  name: string
  description?: string
  criteria: SegmentCriteria[]
  operator: "AND" | "OR"
  isActive: boolean
  customerCount?: number
  lastCalculatedAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.name = data.name
    this.description = data.description
    this.criteria = Array.isArray(data.criteria) ? data.criteria : JSON.parse(data.criteria || "[]")
    this.operator = data.operator || "AND"
    this.isActive = data.is_active !== false
    this.customerCount = data.customer_count
    this.lastCalculatedAt = data.last_calculated_at ? new Date(data.last_calculated_at) : undefined
    this.createdBy = data.created_by
    this.createdAt = new Date(data.created_at)
    this.updatedAt = new Date(data.updated_at)
  }

  // Validation methods
  static validateCreateRequest(data: CreateSegmentRequest): string[] {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required")
    }

    if (data.name && data.name.length > 255) {
      errors.push("Name must be less than 255 characters")
    }

    if (!data.criteria || !Array.isArray(data.criteria) || data.criteria.length === 0) {
      errors.push("At least one criteria is required")
    }

    if (data.criteria) {
      data.criteria.forEach((criteria, index) => {
        const criteriaErrors = Segment.validateCriteria(criteria)
        criteriaErrors.forEach((error) => {
          errors.push(`Criteria ${index + 1}: ${error}`)
        })
      })
    }

    if (data.operator && !["AND", "OR"].includes(data.operator)) {
      errors.push("Operator must be either 'AND' or 'OR'")
    }

    return errors
  }

  static validateUpdateRequest(data: UpdateSegmentRequest): string[] {
    const errors: string[] = []

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push("Name cannot be empty")
      }
      if (data.name && data.name.length > 255) {
        errors.push("Name must be less than 255 characters")
      }
    }

    if (data.criteria !== undefined) {
      if (!Array.isArray(data.criteria) || data.criteria.length === 0) {
        errors.push("At least one criteria is required")
      } else {
        data.criteria.forEach((criteria, index) => {
          const criteriaErrors = Segment.validateCriteria(criteria)
          criteriaErrors.forEach((error) => {
            errors.push(`Criteria ${index + 1}: ${error}`)
          })
        })
      }
    }

    if (data.operator && !["AND", "OR"].includes(data.operator)) {
      errors.push("Operator must be either 'AND' or 'OR'")
    }

    return errors
  }

  static validateCriteria(criteria: SegmentCriteria): string[] {
    const errors: string[] = []

    if (!criteria.field || criteria.field.trim().length === 0) {
      errors.push("Field is required")
    }

    if (!criteria.operator) {
      errors.push("Operator is required")
    }

    if (!Object.values(SegmentOperator).includes(criteria.operator)) {
      errors.push("Invalid operator")
    }

    if (!criteria.dataType) {
      errors.push("Data type is required")
    }

    if (!Object.values(SegmentDataType).includes(criteria.dataType)) {
      errors.push("Invalid data type")
    }

    // Value validation based on operator
    if ([SegmentOperator.IS_NULL, SegmentOperator.IS_NOT_NULL].includes(criteria.operator)) {
      // These operators don't need a value
    } else if ([SegmentOperator.IN, SegmentOperator.NOT_IN].includes(criteria.operator)) {
      if (!Array.isArray(criteria.value)) {
        errors.push("Value must be an array for IN/NOT_IN operators")
      }
    } else if (criteria.operator === SegmentOperator.BETWEEN) {
      if (!Array.isArray(criteria.value) || criteria.value.length !== 2) {
        errors.push("Value must be an array with exactly 2 elements for BETWEEN operator")
      }
    } else if (criteria.value === undefined || criteria.value === null) {
      errors.push("Value is required for this operator")
    }

    return errors
  }

  // Get available fields for segmentation
  static getAvailableFields(): SegmentField[] {
    return [
      // Basic info
      {
        key: "firstName",
        label: "First Name",
        dataType: SegmentDataType.STRING,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.CONTAINS,
          SegmentOperator.NOT_CONTAINS,
          SegmentOperator.STARTS_WITH,
          SegmentOperator.ENDS_WITH,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      {
        key: "lastName",
        label: "Last Name",
        dataType: SegmentDataType.STRING,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.CONTAINS,
          SegmentOperator.NOT_CONTAINS,
          SegmentOperator.STARTS_WITH,
          SegmentOperator.ENDS_WITH,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      {
        key: "email",
        label: "Email",
        dataType: SegmentDataType.STRING,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.CONTAINS,
          SegmentOperator.NOT_CONTAINS,
          SegmentOperator.ENDS_WITH,
          SegmentOperator.REGEX,
        ],
      },
      {
        key: "company",
        label: "Company",
        dataType: SegmentDataType.STRING,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.CONTAINS,
          SegmentOperator.NOT_CONTAINS,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      {
        key: "jobTitle",
        label: "Job Title",
        dataType: SegmentDataType.STRING,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.CONTAINS,
          SegmentOperator.NOT_CONTAINS,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      // Status and scoring
      {
        key: "status",
        label: "Status",
        dataType: SegmentDataType.ENUM,
        operators: [SegmentOperator.EQUALS, SegmentOperator.NOT_EQUALS, SegmentOperator.IN, SegmentOperator.NOT_IN],
        options: [
          { value: CustomerStatus.LEAD, label: "Lead" },
          { value: CustomerStatus.PROSPECT, label: "Prospect" },
          { value: CustomerStatus.CUSTOMER, label: "Customer" },
          { value: CustomerStatus.INACTIVE, label: "Inactive" },
          { value: CustomerStatus.BLOCKED, label: "Blocked" },
        ],
      },
      {
        key: "leadScore",
        label: "Lead Score",
        dataType: SegmentDataType.NUMBER,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.GREATER_THAN,
          SegmentOperator.GREATER_THAN_OR_EQUAL,
          SegmentOperator.LESS_THAN,
          SegmentOperator.LESS_THAN_OR_EQUAL,
          SegmentOperator.BETWEEN,
        ],
      },
      // Communication preferences
      {
        key: "preferredChannel",
        label: "Preferred Channel",
        dataType: SegmentDataType.ENUM,
        operators: [SegmentOperator.EQUALS, SegmentOperator.NOT_EQUALS, SegmentOperator.IN, SegmentOperator.NOT_IN],
        options: [
          { value: CommunicationChannel.EMAIL, label: "Email" },
          { value: CommunicationChannel.WHATSAPP, label: "WhatsApp" },
          { value: CommunicationChannel.TELEGRAM, label: "Telegram" },
          { value: CommunicationChannel.LINE, label: "Line" },
          { value: CommunicationChannel.IN_APP, label: "In-App" },
        ],
      },
      // Tags
      {
        key: "tags",
        label: "Tags",
        dataType: SegmentDataType.ARRAY,
        operators: [SegmentOperator.HAS_TAG, SegmentOperator.NOT_HAS_TAG, SegmentOperator.IN, SegmentOperator.NOT_IN],
      },
      // Metrics
      {
        key: "totalInteractions",
        label: "Total Interactions",
        dataType: SegmentDataType.NUMBER,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.GREATER_THAN,
          SegmentOperator.GREATER_THAN_OR_EQUAL,
          SegmentOperator.LESS_THAN,
          SegmentOperator.LESS_THAN_OR_EQUAL,
          SegmentOperator.BETWEEN,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      {
        key: "lifetimeValue",
        label: "Lifetime Value",
        dataType: SegmentDataType.NUMBER,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.GREATER_THAN,
          SegmentOperator.GREATER_THAN_OR_EQUAL,
          SegmentOperator.LESS_THAN,
          SegmentOperator.LESS_THAN_OR_EQUAL,
          SegmentOperator.BETWEEN,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      // Dates
      {
        key: "createdAt",
        label: "Created Date",
        dataType: SegmentDataType.DATE,
        operators: [
          SegmentOperator.DATE_BEFORE,
          SegmentOperator.DATE_AFTER,
          SegmentOperator.DATE_BETWEEN,
          SegmentOperator.DAYS_AGO,
        ],
      },
      {
        key: "lastInteractionAt",
        label: "Last Interaction Date",
        dataType: SegmentDataType.DATE,
        operators: [
          SegmentOperator.DATE_BEFORE,
          SegmentOperator.DATE_AFTER,
          SegmentOperator.DATE_BETWEEN,
          SegmentOperator.DAYS_AGO,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
      // Source
      {
        key: "source",
        label: "Lead Source",
        dataType: SegmentDataType.STRING,
        operators: [
          SegmentOperator.EQUALS,
          SegmentOperator.NOT_EQUALS,
          SegmentOperator.IN,
          SegmentOperator.NOT_IN,
          SegmentOperator.IS_NULL,
          SegmentOperator.IS_NOT_NULL,
        ],
      },
    ]
  }

  // Convert to database format
  toDatabaseFormat(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      criteria: JSON.stringify(this.criteria),
      operator: this.operator,
      is_active: this.isActive,
      customer_count: this.customerCount,
      last_calculated_at: this.lastCalculatedAt,
      created_by: this.createdBy,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    }
  }

  // Convert to API response format
  toJSON(): ISegment {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      criteria: this.criteria,
      operator: this.operator,
      isActive: this.isActive,
      customerCount: this.customerCount,
      lastCalculatedAt: this.lastCalculatedAt,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
