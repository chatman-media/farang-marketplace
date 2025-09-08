import { query } from "../db/connection"
import {
  Automation,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
  CommunicationChannel,
  LeadStatus,
  LeadPriority,
} from "@marketplace/shared-types"
import { TemplateService } from "./TemplateService"
import { CommunicationService } from "./CommunicationService"

export interface WorkflowTriggerData {
  leadId?: string
  customerId?: string
  oldStage?: string
  newStage?: string
  userId?: string
  [key: string]: any
}

export interface WorkflowExecution {
  id: string
  automationId: string
  triggerData: WorkflowTriggerData
  status: "running" | "completed" | "failed"
  startedAt: Date
  completedAt?: Date
  error?: string
}

export class AutomationService {
  private templateService: TemplateService
  private communicationService?: CommunicationService

  constructor(communicationService?: CommunicationService) {
    this.templateService = new TemplateService()
    this.communicationService = communicationService
  }

  // Initialize automation service with default automations
  async initialize(): Promise<void> {
    try {
      await this.createDefaultAutomations()
    } catch (error) {
      console.error("Failed to initialize automation service:", error)
    }
  }

  // Create default automations using templates
  private async createDefaultAutomations(): Promise<void> {
    const defaultAutomations = [
      {
        name: "New Lead Welcome",
        description: "Send welcome message to new leads",
        trigger: { type: "lead_created" as const, event: "new_lead" },
        conditions: [],
        actions: [
          {
            type: "send_message" as const,
            parameters: {
              name: "New Lead Welcome",
              channel: CommunicationChannel.EMAIL,
              templateName: "welcome_email",
            },
          },
        ],
        isActive: true,
        createdBy: "system",
      },
      {
        name: "Lead Follow-up",
        description: "Follow up with leads after 3 days",
        trigger: { type: "custom_event" as const, event: "lead_follow_up" },
        conditions: [
          {
            field: "daysSinceLastContact",
            operator: "gte",
            value: 3,
          },
        ],
        actions: [
          {
            type: "send_message" as const,
            parameters: {
              name: "Lead Follow-up",
              channel: CommunicationChannel.TELEGRAM,
              templateName: "follow_up_telegram",
            },
          },
        ],
        isActive: true,
        createdBy: "system",
      },
    ]

    for (const automation of defaultAutomations) {
      // Check if automation already exists
      const existing = await query("SELECT id FROM automations WHERE name = $1", [automation.name])

      if (existing.rows.length === 0) {
        await this.createAutomation(automation)
        console.log(`✅ Created default automation: ${automation.name}`)
      }
    }
  }
  // Trigger workflow by name or event
  async triggerWorkflow(eventName: string, data: WorkflowTriggerData): Promise<void> {
    try {
      // Find active automations for this trigger
      const automations = await this.getAutomationsByTrigger(eventName)

      for (const automation of automations) {
        // Check if conditions are met
        if (await this.evaluateConditions(automation.conditions, data)) {
          await this.executeAutomation(automation, data)
        }
      }
    } catch (error) {
      console.error(`Failed to trigger workflow ${eventName}:`, error)
      throw error
    }
  }

  // Get automations by trigger type
  private async getAutomationsByTrigger(eventName: string): Promise<Automation[]> {
    try {
      const result = await query(
        `SELECT * FROM automations
         WHERE is_active = true
         AND (trigger->>'type' = $1 OR trigger->>'event' = $1)`,
        [eventName],
      )

      if (!result || !result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        trigger: row.trigger,
        conditions: row.conditions,
        actions: row.actions,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }))
    } catch (error) {
      console.warn(`Failed to get automations for trigger ${eventName}:`, error)
      return []
    }
  }

  // Evaluate automation conditions
  private async evaluateConditions(conditions: AutomationCondition[], data: WorkflowTriggerData): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(data, condition.field)

      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false
      }
    }

    return true
  }

  // Get field value from trigger data
  private getFieldValue(data: WorkflowTriggerData, field: string): any {
    const parts = field.split(".")
    let value: any = data

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  // Evaluate single condition
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case "equals":
        return fieldValue === expectedValue
      case "not_equals":
        return fieldValue !== expectedValue
      case "contains":
        return typeof fieldValue === "string" && fieldValue.includes(expectedValue)
      case "greater_than":
        return Number(fieldValue) > Number(expectedValue)
      case "less_than":
        return Number(fieldValue) < Number(expectedValue)
      case "in":
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
      case "not_in":
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)
      default:
        console.warn(`Unknown operator: ${operator}`)
        return false
    }
  }

  // Execute automation actions
  private async executeAutomation(automation: Automation, data: WorkflowTriggerData): Promise<void> {
    console.log(`Executing automation: ${automation.name}`)

    try {
      for (const action of automation.actions) {
        await this.executeAction(action, data)
      }
    } catch (error) {
      console.error(`Failed to execute automation ${automation.name}:`, error)
      throw error
    }
  }

  // Execute single action
  private async executeAction(action: AutomationAction, data: WorkflowTriggerData): Promise<void> {
    switch (action.type) {
      case "send_message":
        await this.executeSendMessageAction(action, data)
        break
      case "update_lead":
        await this.executeUpdateLeadAction(action, data)
        break
      case "assign_lead":
        await this.executeAssignLeadAction(action, data)
        break
      case "create_task":
        await this.executeCreateTaskAction(action, data)
        break
      case "webhook":
        await this.executeWebhookAction(action, data)
        break
      default:
        console.warn(`Unknown action type: ${action.type}`)
    }
  }

  // Send message action
  private async executeSendMessageAction(action: AutomationAction, data: WorkflowTriggerData): Promise<void> {
    const { customerId, channel, templateId, templateName, content } = action.parameters
    const targetCustomerId = customerId || data.customerId

    if (!targetCustomerId) {
      console.error("No customer ID provided for send message action")
      return
    }

    try {
      let messageContent = content
      let messageSubject: string | undefined

      // Use template if specified
      if (templateId || templateName) {
        // Get customer data for template context
        const customerResult = await query("SELECT * FROM customers WHERE id = $1", [targetCustomerId])
        const customer = customerResult.rows[0]

        // Get lead data if available
        let lead = null
        if (data.leadId) {
          const leadResult = await query("SELECT * FROM leads WHERE id = $1", [data.leadId])
          lead = leadResult.rows[0]
        }

        // Build template context
        const templateContext = {
          customer,
          lead,
          trigger: data.trigger || "automation",
          ...data, // Include all trigger data
        }

        // Render template
        let renderedTemplate
        if (templateId) {
          renderedTemplate = await this.templateService.renderTemplate(templateId, templateContext)
        } else if (templateName) {
          renderedTemplate = await this.templateService.renderTemplateByName(templateName, templateContext)
        }

        if (renderedTemplate) {
          messageContent = renderedTemplate.content
          messageSubject = renderedTemplate.subject
        }
      }

      console.log(`Executing automation: ${action.parameters.name || "Unnamed Action"}`)
      console.log(`Sending message to customer ${targetCustomerId} via ${channel || "email"}`)

      // Send message through CommunicationService if available
      if (this.communicationService) {
        await this.communicationService.sendMessage({
          customerId: targetCustomerId,
          channel: channel || CommunicationChannel.EMAIL,
          content: messageContent || "Automated message",
          subject: messageSubject,
          templateId: templateId,
        })
      } else {
        // For testing or when communication service is not available
        console.log(`Would send message: ${messageContent}`)
      }
    } catch (error) {
      console.error("Failed to send automated message:", error)
      throw error
    }
  }

  // Update lead action
  private async executeUpdateLeadAction(action: AutomationAction, data: WorkflowTriggerData): Promise<void> {
    const leadId = action.parameters.leadId || data.leadId
    if (!leadId) return

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(action.parameters).forEach(([key, value]) => {
      if (key !== "leadId" && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    })

    if (updates.length > 0) {
      values.push(leadId)
      await query(`UPDATE leads SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex}`, values)
    }
  }

  // Assign lead action
  private async executeAssignLeadAction(action: AutomationAction, data: WorkflowTriggerData): Promise<void> {
    const leadId = action.parameters.leadId || data.leadId
    const assignedTo = action.parameters.assignedTo

    if (leadId && assignedTo) {
      await query("UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2", [assignedTo, leadId])
    }
  }

  // Create task action
  private async executeCreateTaskAction(action: AutomationAction, data: WorkflowTriggerData): Promise<void> {
    // TODO: Implement task creation when task system is available
    console.log("Creating task:", action.parameters)
  }

  // Webhook action
  private async executeWebhookAction(action: AutomationAction, data: WorkflowTriggerData): Promise<void> {
    const { url, method = "POST", headers = {} } = action.parameters

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Webhook execution failed:", error)
      throw error
    }
  }

  // Create new automation
  async createAutomation(automation: Omit<Automation, "id" | "createdAt" | "updatedAt">): Promise<Automation> {
    const result = await query(
      `INSERT INTO automations (name, description, trigger, conditions, actions, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        automation.name,
        automation.description,
        JSON.stringify(automation.trigger),
        JSON.stringify(automation.conditions),
        JSON.stringify(automation.actions),
        automation.isActive,
        automation.createdBy,
      ],
    )

    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      conditions: row.conditions,
      actions: row.actions,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  // Get automation by ID
  async getAutomationById(id: string): Promise<Automation | null> {
    const result = await query("SELECT * FROM automations WHERE id = $1", [id])

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      conditions: row.conditions,
      actions: row.actions,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  // List automations
  async getAutomations(filters: { isActive?: boolean } = {}): Promise<Automation[]> {
    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (filters.isActive !== undefined) {
      whereClause += " AND is_active = $1"
      params.push(filters.isActive)
    }

    const result = await query(`SELECT * FROM automations ${whereClause} ORDER BY created_at DESC`, params)

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      conditions: row.conditions,
      actions: row.actions,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }))
  }
}
