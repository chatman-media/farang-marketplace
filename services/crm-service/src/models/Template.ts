import { CommunicationChannel } from "@marketplace/shared-types"

export interface TemplateVariable {
  name: string
  type: "string" | "number" | "boolean" | "date"
  required: boolean
  description?: string
  defaultValue?: any
}

export interface TemplateConditions {
  triggers?: string[]
  conditions?: Record<string, any>
  customerSegment?: string[]
  leadStatus?: string[]
  timeConstraints?: {
    hoursBeforeAppointment?: number
    daysSinceLastContact?: number
    timeOfDay?: string
    dayOfWeek?: string[]
  }
}

export interface ITemplate {
  id: string
  name: string
  type: CommunicationChannel | "universal"
  category: string
  subject?: string
  content: string
  variables: string[]
  conditions: TemplateConditions
  isActive: boolean
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateTemplateRequest {
  name: string
  type: CommunicationChannel | "universal"
  category: string
  subject?: string
  content: string
  variables?: string[]
  conditions?: TemplateConditions
  isActive?: boolean
  createdBy?: string
}

export interface UpdateTemplateRequest {
  name?: string
  type?: CommunicationChannel | "universal"
  category?: string
  subject?: string
  content?: string
  variables?: string[]
  conditions?: TemplateConditions
  isActive?: boolean
}

export class Template {
  public id: string
  public name: string
  public type: CommunicationChannel | "universal"
  public category: string
  public subject?: string
  public content: string
  public variables: string[]
  public conditions: TemplateConditions
  public isActive: boolean
  public createdBy?: string
  public createdAt: Date
  public updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.category = data.category
    this.subject = data.subject
    this.content = data.content
    this.variables = Array.isArray(data.variables)
      ? data.variables
      : typeof data.variables === "string"
        ? JSON.parse(data.variables)
        : []
    this.conditions = typeof data.conditions === "string" ? JSON.parse(data.conditions) : data.conditions || {}
    this.isActive = data.is_active !== undefined ? data.is_active : data.isActive !== undefined ? data.isActive : true
    this.createdBy = data.created_by || data.createdBy
    this.createdAt = new Date(data.created_at || data.createdAt)
    this.updatedAt = new Date(data.updated_at || data.updatedAt)
  }

  // Validation methods
  static validateCreateRequest(data: CreateTemplateRequest): string[] {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required")
    }

    if (!data.type) {
      errors.push("Type is required")
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push("Category is required")
    }

    if (!data.content || data.content.trim().length === 0) {
      errors.push("Content is required")
    }

    // Validate email templates have subject
    if (data.type === CommunicationChannel.EMAIL && (!data.subject || data.subject.trim().length === 0)) {
      errors.push("Subject is required for email templates")
    }

    // Validate variables format
    if (data.variables && !Array.isArray(data.variables)) {
      errors.push("Variables must be an array")
    }

    return errors
  }

  static validateUpdateRequest(data: UpdateTemplateRequest): string[] {
    const errors: string[] = []

    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      errors.push("Name cannot be empty")
    }

    if (data.content !== undefined && (!data.content || data.content.trim().length === 0)) {
      errors.push("Content cannot be empty")
    }

    if (data.category !== undefined && (!data.category || data.category.trim().length === 0)) {
      errors.push("Category cannot be empty")
    }

    // Validate variables format
    if (data.variables !== undefined && !Array.isArray(data.variables)) {
      errors.push("Variables must be an array")
    }

    return errors
  }

  // Extract variables from template content
  extractVariables(): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = variableRegex.exec(this.content)) !== null) {
      const variable = match[1].trim()
      // Handle Handlebars helpers like {{#if variable}}
      if (!variable.startsWith("#") && !variable.startsWith("/")) {
        variables.add(variable)
      }
    }

    // Also extract from subject if exists
    if (this.subject) {
      const subjectRegex = /\{\{([^}]+)\}\}/g
      while ((match = subjectRegex.exec(this.subject)) !== null) {
        const variable = match[1].trim()
        if (!variable.startsWith("#") && !variable.startsWith("/")) {
          variables.add(variable)
        }
      }
    }

    return Array.from(variables)
  }

  // Check if template matches given conditions
  matchesConditions(context: Record<string, any>): boolean {
    if (!this.conditions || Object.keys(this.conditions).length === 0) {
      return true
    }

    // Check trigger match
    if (this.conditions.triggers && context.trigger) {
      if (!this.conditions.triggers.includes(context.trigger)) {
        return false
      }
    }

    // Check customer segment
    if (this.conditions.customerSegment && context.customer?.tags) {
      const hasMatchingTag = this.conditions.customerSegment.some((segment) => context.customer.tags.includes(segment))
      if (!hasMatchingTag) {
        return false
      }
    }

    // Check lead status
    if (this.conditions.leadStatus && context.lead?.status) {
      if (!this.conditions.leadStatus.includes(context.lead.status)) {
        return false
      }
    }

    // Check time constraints
    if (this.conditions.timeConstraints) {
      const timeConstraints = this.conditions.timeConstraints
      const now = new Date()

      // Check days since last contact
      if (timeConstraints.daysSinceLastContact && context.customer?.lastInteractionAt) {
        const daysSince = Math.floor(
          (now.getTime() - new Date(context.customer.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysSince < timeConstraints.daysSinceLastContact) {
          return false
        }
      }

      // Check time of day
      if (timeConstraints.timeOfDay) {
        const currentHour = now.getHours()
        const [startHour, endHour] = timeConstraints.timeOfDay.split("-").map((h) => parseInt(h))
        if (currentHour < startHour || currentHour > endHour) {
          return false
        }
      }

      // Check day of week
      if (timeConstraints.dayOfWeek) {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const currentDay = dayNames[now.getDay()]
        if (!timeConstraints.dayOfWeek.includes(currentDay)) {
          return false
        }
      }
    }

    return true
  }

  // Convert to database format
  toDatabaseFormat(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      subject: this.subject,
      content: this.content,
      variables: JSON.stringify(this.variables),
      conditions: JSON.stringify(this.conditions),
      is_active: this.isActive,
      created_by: this.createdBy,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    }
  }

  // Convert to API response format
  toJSON(): ITemplate {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      subject: this.subject,
      content: this.content,
      variables: this.variables,
      conditions: this.conditions,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
