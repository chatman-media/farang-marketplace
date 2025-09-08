import { query } from "../db/connection"
import { Customer } from "../models/Customer"
import { Lead } from "../models/Lead"
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateLeadRequest,
  UpdateLeadRequest,
  CustomerStatus,
  LeadStatus,
  LeadPriority,
  CRMAnalytics,
} from "@marketplace/shared-types"

export class CRMService {
  // Customer management
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const errors = Customer.validateCreateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    // Check if customer with this email already exists
    const existingCustomer = await this.getCustomerByEmail(data.email)
    if (existingCustomer) {
      throw new Error("Customer with this email already exists")
    }

    const result = await query(
      `INSERT INTO customers (
        user_id, email, phone, telegram_id, whatsapp_id,
        first_name, last_name, preferred_language, preferred_channel,
        tags, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.userId || null,
        data.email,
        data.phone || null,
        data.telegramId || null,
        data.whatsappId || null,
        data.firstName,
        data.lastName,
        data.preferredLanguage || "en",
        data.preferredChannel || "email",
        data.tags || [],
        JSON.stringify(data.customFields || {}),
      ],
    )

    return new Customer(result.rows[0])
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const result = await query("SELECT * FROM customers WHERE id = $1", [id])
    return result.rows.length > 0 ? new Customer(result.rows[0]) : null
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const result = await query("SELECT * FROM customers WHERE email = $1", [email])
    return result.rows.length > 0 ? new Customer(result.rows[0]) : null
  }

  async getCustomerByUserId(userId: string): Promise<Customer | null> {
    const result = await query("SELECT * FROM customers WHERE user_id = $1", [userId])
    return result.rows.length > 0 ? new Customer(result.rows[0]) : null
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer | null> {
    const errors = Customer.validateUpdateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case "userId":
            updates.push(`user_id = $${paramIndex}`)
            values.push(value)
            break
          case "firstName":
            updates.push(`first_name = $${paramIndex}`)
            values.push(value)
            break
          case "lastName":
            updates.push(`last_name = $${paramIndex}`)
            values.push(value)
            break
          case "preferredLanguage":
            updates.push(`preferred_language = $${paramIndex}`)
            values.push(value)
            break
          case "preferredChannel":
            updates.push(`preferred_channel = $${paramIndex}`)
            values.push(value)
            break
          case "telegramId":
            updates.push(`telegram_id = $${paramIndex}`)
            values.push(value)
            break
          case "whatsappId":
            updates.push(`whatsapp_id = $${paramIndex}`)
            values.push(value)
            break
          case "leadScore":
            updates.push(`lead_score = $${paramIndex}`)
            values.push(value)
            break
          case "customFields":
            updates.push(`custom_fields = $${paramIndex}`)
            values.push(JSON.stringify(value))
            break
          default:
            if (["email", "phone", "status", "tags"].includes(key)) {
              updates.push(`${key} = $${paramIndex}`)
              values.push(value)
            }
        }
        paramIndex++
      }
    })

    if (updates.length === 0) {
      return await this.getCustomerById(id)
    }

    values.push(id)
    const result = await query(
      `UPDATE customers SET ${updates.join(", ")}, updated_at = NOW() 
       WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    return result.rows.length > 0 ? new Customer(result.rows[0]) : null
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await query("DELETE FROM customers WHERE id = $1", [id])
    return result.rowCount > 0
  }

  async getCustomers(
    filters: {
      status?: CustomerStatus
      tags?: string[]
      search?: string
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const queryParams: any[] = []
    let paramIndex = 1

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex}`
      queryParams.push(filters.status)
      paramIndex++
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause += ` AND tags && $${paramIndex}`
      queryParams.push(filters.tags)
      paramIndex++
    }

    if (filters.search) {
      whereClause += ` AND (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`
      queryParams.push(`%${filters.search}%`)
      paramIndex++
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM customers ${whereClause}`, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get customers
    queryParams.push(limit, offset)
    const result = await query(
      `SELECT * FROM customers ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams,
    )

    const customers = result.rows.map((row: any) => new Customer(row))

    return {
      customers,
      total,
      page,
      limit,
    }
  }

  // Lead management
  async createLead(data: CreateLeadRequest): Promise<Lead> {
    const errors = Lead.validateCreateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    // Verify customer exists
    const customer = await this.getCustomerById(data.customerId)
    if (!customer) {
      throw new Error("Customer not found")
    }

    const result = await query(
      `INSERT INTO leads (
        customer_id, listing_id, source, priority, value, notes, follow_up_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        data.customerId,
        data.listingId || null,
        data.source,
        data.priority || LeadPriority.MEDIUM,
        data.value || null,
        data.notes || "",
        data.followUpDate || null,
      ],
    )

    const lead = new Lead(result.rows[0])

    // Update customer lead score based on new lead
    const newScore = await this.calculateCustomerLeadScore(data.customerId)
    await this.updateCustomer(data.customerId, { leadScore: newScore })

    return lead
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const result = await query("SELECT * FROM leads WHERE id = $1", [id])
    return result.rows.length > 0 ? new Lead(result.rows[0]) : null
  }

  async updateLead(id: string, data: UpdateLeadRequest): Promise<Lead | null> {
    const errors = Lead.validateUpdateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case "customerId":
            updates.push(`customer_id = $${paramIndex}`)
            values.push(value)
            break
          case "listingId":
            updates.push(`listing_id = $${paramIndex}`)
            values.push(value)
            break
          case "assignedTo":
            updates.push(`assigned_to = $${paramIndex}`)
            values.push(value)
            break
          case "followUpDate":
            updates.push(`follow_up_date = $${paramIndex}`)
            values.push(value)
            break
          default:
            if (["source", "status", "priority", "value", "notes"].includes(key)) {
              updates.push(`${key} = $${paramIndex}`)
              values.push(value)
            }
        }
        paramIndex++
      }
    })

    if (updates.length === 0) {
      return await this.getLeadById(id)
    }

    values.push(id)
    const result = await query(
      `UPDATE leads SET ${updates.join(", ")}, updated_at = NOW() 
       WHERE id = $${paramIndex} RETURNING *`,
      values,
    )

    if (result.rows.length > 0) {
      const lead = new Lead(result.rows[0])

      // Update customer lead score if lead status changed
      if (data.status) {
        const newScore = await this.calculateCustomerLeadScore(lead.customerId)
        await this.updateCustomer(lead.customerId, { leadScore: newScore })
      }

      return lead
    }

    return null
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await query("DELETE FROM leads WHERE id = $1", [id])
    return result.rowCount > 0
  }

  async getLeadsByCustomer(customerId: string): Promise<Lead[]> {
    const result = await query("SELECT * FROM leads WHERE customer_id = $1 ORDER BY created_at DESC", [customerId])
    return result.rows.map((row: any) => new Lead(row))
  }

  async getLeads(
    filters: {
      status?: LeadStatus
      priority?: LeadPriority
      assignedTo?: string
      customerId?: string
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ leads: Lead[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const queryParams: any[] = []
    let paramIndex = 1

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case "customerId":
            whereClause += ` AND customer_id = $${paramIndex}`
            break
          case "assignedTo":
            whereClause += ` AND assigned_to = $${paramIndex}`
            break
          default:
            whereClause += ` AND ${key} = $${paramIndex}`
        }
        queryParams.push(value)
        paramIndex++
      }
    })

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM leads ${whereClause}`, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get leads
    queryParams.push(limit, offset)
    const result = await query(
      `SELECT * FROM leads ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams,
    )

    const leads = result.rows.map((row: any) => new Lead(row))

    return {
      leads,
      total,
      page,
      limit,
    }
  }

  // Analytics and scoring
  async calculateCustomerLeadScore(customerId: string): Promise<number> {
    const leads = await this.getLeadsByCustomer(customerId)

    if (leads.length === 0) return 0

    let totalScore = 0
    let activeLeads = 0

    leads.forEach((lead) => {
      if (lead.isActive()) {
        totalScore += lead.calculateScore()
        activeLeads++
      }
    })

    // Base score from active leads
    const averageLeadScore = activeLeads > 0 ? totalScore / activeLeads : 0

    // Bonus for multiple active leads
    const multipleLeadsBonus = Math.min(activeLeads * 5, 20)

    // Bonus for won leads
    const wonLeads = leads.filter((lead) => lead.isWon()).length
    const wonLeadsBonus = Math.min(wonLeads * 10, 30)

    const finalScore = averageLeadScore + multipleLeadsBonus + wonLeadsBonus

    return Math.max(0, Math.min(100, Math.round(finalScore)))
  }

  async getCRMAnalytics(): Promise<CRMAnalytics> {
    // Get basic counts
    const customerCountResult = await query("SELECT COUNT(*) as total FROM customers")
    const leadCountResult = await query("SELECT COUNT(*) as total FROM leads")

    // Get customers by status
    const customersByStatusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM customers 
      GROUP BY status
    `)

    // Get leads by status
    const leadsByStatusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `)

    // Calculate conversion rate
    const wonLeadsResult = await query(`
      SELECT COUNT(*) as won 
      FROM leads 
      WHERE status = 'closed_won'
    `)

    const totalLeads = parseInt(leadCountResult.rows[0].total)
    const wonLeads = parseInt(wonLeadsResult.rows[0].won)
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

    // Get average lead score
    const avgScoreResult = await query(`
      SELECT AVG(lead_score) as avg_score 
      FROM customers 
      WHERE lead_score > 0
    `)

    // Get communication stats
    const messageStatsResult = await query(`
      SELECT 
        COUNT(*) as sent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded
      FROM communication_history
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `)

    const messageStats = messageStatsResult.rows[0]
    const responseRate =
      messageStats.sent > 0 ? (parseInt(messageStats.responded) / parseInt(messageStats.sent)) * 100 : 0

    // Build response object
    const customersByStatus: Record<CustomerStatus, number> = {
      [CustomerStatus.LEAD]: 0,
      [CustomerStatus.PROSPECT]: 0,
      [CustomerStatus.CUSTOMER]: 0,
      [CustomerStatus.INACTIVE]: 0,
      [CustomerStatus.BLOCKED]: 0,
    }
    customersByStatusResult.rows.forEach((row: any) => {
      customersByStatus[row.status as CustomerStatus] = parseInt(row.count)
    })

    const leadsByStatus: Record<LeadStatus, number> = {
      [LeadStatus.NEW]: 0,
      [LeadStatus.CONTACTED]: 0,
      [LeadStatus.QUALIFIED]: 0,
      [LeadStatus.PROPOSAL]: 0,
      [LeadStatus.NEGOTIATION]: 0,
      [LeadStatus.CLOSED_WON]: 0,
      [LeadStatus.CLOSED_LOST]: 0,
    }
    leadsByStatusResult.rows.forEach((row: any) => {
      leadsByStatus[row.status as LeadStatus] = parseInt(row.count)
    })

    return {
      totalCustomers: parseInt(customerCountResult.rows[0].total),
      totalLeads: totalLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageLeadScore: Math.round((parseFloat(avgScoreResult.rows[0].avg_score) || 0) * 100) / 100,
      leadsByStatus,
      customersByStatus,
      messagesSent: parseInt(messageStats.sent),
      messagesDelivered: parseInt(messageStats.delivered),
      responseRate: Math.round(responseRate * 100) / 100,
      topPerformingCampaigns: [], // TODO: Implement when campaigns are ready
      recentActivity: [], // TODO: Implement when communication history is ready
    }
  }
}
