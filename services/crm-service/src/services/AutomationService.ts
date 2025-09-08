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

      return result.rows.map((row) => ({
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
    const { customerId, channel, templateId, content } = action.parameters

    // This would integrate with CommunicationService
    console.log(`Sending message to customer ${customerId || data.customerId} via ${channel}`)

    // TODO: Integrate with actual CommunicationService
    // await this.communicationService.sendMessage({
    //   customerId: customerId || data.customerId,
    //   channel: channel || CommunicationChannel.EMAIL,
    //   content: content || 'Automated message',
    //   templateId
    // })
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

    return result.rows.map((row) => ({
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
