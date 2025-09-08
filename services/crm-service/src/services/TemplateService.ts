import { query } from "../db/connection"
import { Template, CreateTemplateRequest, UpdateTemplateRequest } from "../models/Template"
import { CommunicationChannel } from "@marketplace/shared-types"

export interface TemplateRenderContext {
  customer?: any
  lead?: any
  appointment?: any
  property?: any
  agent?: any
  trigger?: string
  [key: string]: any
}

export interface RenderedTemplate {
  subject?: string
  content: string
  variables: Record<string, any>
}

export class TemplateService {
  constructor() {
    // Simple template service without external dependencies
  }

  // CRUD operations
  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const errors = Template.validateCreateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    // Check if template with this name already exists
    const existingTemplate = await this.getTemplateByName(data.name)
    if (existingTemplate) {
      throw new Error("Template with this name already exists")
    }

    const result = await query(
      `INSERT INTO message_templates (
        name, type, category, subject, content, variables, conditions, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.name,
        data.type,
        data.category,
        data.subject || null,
        data.content,
        JSON.stringify(data.variables || []),
        JSON.stringify(data.conditions || {}),
        data.isActive !== undefined ? data.isActive : true,
        data.createdBy || null,
      ],
    )

    return new Template(result.rows[0])
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const result = await query("SELECT * FROM message_templates WHERE id = $1", [id])
    return result.rows.length > 0 ? new Template(result.rows[0]) : null
  }

  async getTemplateByName(name: string): Promise<Template | null> {
    const result = await query("SELECT * FROM message_templates WHERE name = $1", [name])
    return result.rows.length > 0 ? new Template(result.rows[0]) : null
  }

  async getTemplates(
    filters: {
      type?: CommunicationChannel | "universal"
      category?: string
      isActive?: boolean
      search?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<{ templates: Template[]; total: number }> {
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (filters.type) {
      whereConditions.push(`type = $${paramIndex}`)
      queryParams.push(filters.type)
      paramIndex++
    }

    if (filters.category) {
      whereConditions.push(`category = $${paramIndex}`)
      queryParams.push(filters.category)
      paramIndex++
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`)
      queryParams.push(filters.isActive)
      paramIndex++
    }

    if (filters.search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`)
      queryParams.push(`%${filters.search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM message_templates ${whereClause}`, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get templates with pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const result = await query(
      `SELECT * FROM message_templates ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset],
    )

    const templates = result.rows.map((row: any) => new Template(row))
    return { templates, total }
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template | null> {
    const errors = Template.validateUpdateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case "name":
          case "type":
          case "category":
          case "subject":
          case "content":
            updates.push(`${key} = $${paramIndex}`)
            values.push(value)
            break
          case "variables":
          case "conditions":
            updates.push(`${key} = $${paramIndex}`)
            values.push(JSON.stringify(value))
            break
          case "isActive":
            updates.push(`is_active = $${paramIndex}`)
            values.push(value)
            break
        }
        paramIndex++
      }
    })

    if (updates.length === 0) {
      return await this.getTemplateById(id)
    }

    values.push(id)
    const result = await query(
      `UPDATE message_templates SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    return result && result.rows && result.rows.length > 0 ? new Template(result.rows[0]) : null
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await query("DELETE FROM message_templates WHERE id = $1", [id])
    return result.rowCount > 0
  }

  // Template rendering
  async renderTemplate(templateId: string, context: TemplateRenderContext): Promise<RenderedTemplate> {
    const template = await this.getTemplateById(templateId)
    if (!template) {
      throw new Error("Template not found")
    }

    if (!template.isActive) {
      throw new Error("Template is not active")
    }

    return this.renderTemplateContent(template, context)
  }

  async renderTemplateByName(templateName: string, context: TemplateRenderContext): Promise<RenderedTemplate> {
    const template = await this.getTemplateByName(templateName)
    if (!template) {
      throw new Error("Template not found")
    }

    if (!template.isActive) {
      throw new Error("Template is not active")
    }

    return this.renderTemplateContent(template, context)
  }

  private renderTemplateContent(template: Template, context: TemplateRenderContext): RenderedTemplate {
    try {
      // Simple variable replacement without external dependencies
      let renderedContent = template.content
      let renderedSubject = template.subject

      // Replace variables in content
      renderedContent = this.replaceVariables(renderedContent, context)

      // Replace variables in subject if exists
      if (renderedSubject) {
        renderedSubject = this.replaceVariables(renderedSubject, context)
      }

      // Extract variables that were actually used
      const usedVariables: Record<string, any> = {}
      template.variables.forEach((variable) => {
        if (context[variable] !== undefined) {
          usedVariables[variable] = context[variable]
        }
      })

      return {
        subject: renderedSubject,
        content: renderedContent,
        variables: usedVariables,
      }
    } catch (error: any) {
      throw new Error(`Template rendering failed: ${error.message}`)
    }
  }

  // Simple variable replacement method
  private replaceVariables(text: string, context: TemplateRenderContext): string {
    let result = text

    // Replace simple variables {{variableName}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim()

      // Handle nested properties like {{customer.firstName}}
      const value = this.getNestedProperty(context, trimmedName)
      return value !== undefined ? String(value) : match
    })

    // Handle simple conditional blocks {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, condition, content) => {
      const conditionValue = this.getNestedProperty(context, condition.trim())
      return conditionValue ? content : ""
    })

    return result
  }

  // Get nested property from object (e.g., "customer.firstName" from context)
  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Find templates matching conditions
  async findMatchingTemplates(
    type: CommunicationChannel | "universal",
    category: string,
    context: TemplateRenderContext,
  ): Promise<Template[]> {
    const { templates } = await this.getTemplates({
      type,
      category,
      isActive: true,
    })

    return templates.filter((template) => template.matchesConditions(context))
  }

  // Get template statistics
  async getTemplateStats(): Promise<{
    totalTemplates: number
    activeTemplates: number
    templatesByType: Record<string, number>
    templatesByCategory: Record<string, number>
  }> {
    const totalResult = await query("SELECT COUNT(*) as total FROM message_templates")
    const activeResult = await query("SELECT COUNT(*) as total FROM message_templates WHERE is_active = true")

    const typeResult = await query(`
      SELECT type, COUNT(*) as count 
      FROM message_templates 
      WHERE is_active = true 
      GROUP BY type
    `)

    const categoryResult = await query(`
      SELECT category, COUNT(*) as count 
      FROM message_templates 
      WHERE is_active = true 
      GROUP BY category
    `)

    const templatesByType: Record<string, number> = {}
    typeResult.rows.forEach((row: any) => {
      templatesByType[row.type] = parseInt(row.count)
    })

    const templatesByCategory: Record<string, number> = {}
    categoryResult.rows.forEach((row: any) => {
      templatesByCategory[row.category] = parseInt(row.count)
    })

    return {
      totalTemplates: parseInt(totalResult.rows[0].total),
      activeTemplates: parseInt(activeResult.rows[0].total),
      templatesByType,
      templatesByCategory,
    }
  }

  // Simple template rendering for preview (public method)
  renderSimpleTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
      rendered = rendered.replace(regex, String(value || ""))
    })

    // Handle conditional blocks
    rendered = rendered.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (_match, condition, content) => {
      const value = variables[condition]
      return value ? content : ""
    })

    return rendered
  }
}
