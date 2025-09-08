import { EmailService } from "./EmailService"
import { TelegramService } from "./TelegramService"
import { WhatsAppService } from "./WhatsAppService"
import { LineService } from "./LineService"
import { query } from "../db/connection"
import {
  CommunicationChannel,
  type SendMessageResponse,
  type CommunicationHistory,
  type Customer,
} from "@marketplace/shared-types"

export interface UnifiedSendRequest {
  customerId: string
  leadId?: string
  content: string
  subject?: string
  channel?: CommunicationChannel
  templateId?: string
  templateVariables?: Record<string, any>
  campaignId?: string
  priority?: "low" | "medium" | "high" | "urgent"
  scheduleAt?: Date
}

export interface ConversationThread {
  customerId: string
  channel: CommunicationChannel
  messages: CommunicationHistory[]
  lastMessageAt: Date
  messageCount: number
  unreadCount: number
}

export class CommunicationService {
  private emailService: EmailService
  private telegramService: TelegramService
  private whatsappService: WhatsAppService
  private lineService: LineService

  constructor() {
    this.emailService = new EmailService()
    this.telegramService = new TelegramService()
    this.whatsappService = new WhatsAppService()
    this.lineService = new LineService()
  }

  async initialize(): Promise<void> {
    try {
      // Initialize WhatsApp service
      await this.whatsappService.initialize()

      // Start Telegram bot
      await this.telegramService.startBot()

      // Verify email connection
      const emailReady = await this.emailService.verifyConnection()
      if (!emailReady) {
        console.warn("Email service connection failed")
      }

      console.log("Communication services initialized")
    } catch (error) {
      console.error("Failed to initialize communication services:", error)
      throw error
    }
  }

  async sendMessage(request: UnifiedSendRequest): Promise<SendMessageResponse> {
    try {
      // Get customer information
      const customer = await this.getCustomer(request.customerId)
      if (!customer) {
        throw new Error("Customer not found")
      }

      // Determine channel if not specified
      const channel = request.channel || customer.preferredChannel

      // Get contact information for the channel
      const contactInfo = this.getContactInfoForChannel(customer, channel)
      if (!contactInfo) {
        throw new Error(`No contact information available for channel: ${channel}`)
      }

      // Send message through appropriate service
      let result: SendMessageResponse

      switch (channel) {
        case CommunicationChannel.EMAIL:
          result = await this.emailService.sendEmail({
            customerId: request.customerId,
            leadId: request.leadId,
            channel: CommunicationChannel.EMAIL,
            to: contactInfo.value,
            subject: request.subject || "Message from Thailand Marketplace",
            content: request.content,
            templateId: request.templateId,
            templateVariables: request.templateVariables,
            scheduleAt: request.scheduleAt,
          })
          break

        case CommunicationChannel.TELEGRAM:
          result = await this.telegramService.sendMessage({
            customerId: request.customerId,
            leadId: request.leadId,
            channel: CommunicationChannel.TELEGRAM,
            chatId: contactInfo.value,
            content: request.content,
            templateId: request.templateId,
            templateVariables: request.templateVariables,
            scheduleAt: request.scheduleAt,
          })
          break

        case CommunicationChannel.WHATSAPP:
          result = await this.whatsappService.sendMessage({
            customerId: request.customerId,
            leadId: request.leadId,
            channel: CommunicationChannel.WHATSAPP,
            phoneNumber: contactInfo.value,
            content: request.content,
            templateId: request.templateId,
            templateVariables: request.templateVariables,
            scheduleAt: request.scheduleAt,
          })
          break

        case CommunicationChannel.LINE:
          result = await this.lineService.sendMessage({
            customerId: request.customerId,
            leadId: request.leadId,
            channel: CommunicationChannel.LINE,
            userId: contactInfo.value,
            content: request.content,
            templateId: request.templateId,
            templateVariables: request.templateVariables,

            scheduleAt: request.scheduleAt,
          })
          break

        default:
          throw new Error(`Unsupported communication channel: ${channel}`)
      }

      return result
    } catch (error: any) {
      console.error("Failed to send unified message:", error)
      throw error
    }
  }

  async sendBulkMessage(
    customerIds: string[],
    request: Omit<UnifiedSendRequest, "customerId">,
  ): Promise<SendMessageResponse[]> {
    const results: SendMessageResponse[] = []

    for (const customerId of customerIds) {
      try {
        const result = await this.sendMessage({ ...request, customerId })
        results.push(result)
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          channel: request.channel || CommunicationChannel.EMAIL,
          status: "failed",
        })
      }

      // Add delay to avoid overwhelming the services
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return results
  }

  async getConversationThreads(
    customerId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<ConversationThread[]> {
    const { limit = 10, offset = 0 } = options

    // Get conversation threads grouped by channel
    const result = await query(
      `SELECT 
        channel,
        COUNT(*) as message_count,
        COUNT(CASE WHEN read_at IS NULL AND direction = 'inbound' THEN 1 END) as unread_count,
        MAX(created_at) as last_message_at
       FROM communication_history 
       WHERE customer_id = $1
       GROUP BY channel
       ORDER BY last_message_at DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    )

    const threads: ConversationThread[] = []

    for (const row of result.rows) {
      // Get recent messages for this channel
      const messages = await this.getCommunicationHistory(customerId, {
        channel: row.channel,
        limit: 10,
      })

      threads.push({
        customerId,
        channel: row.channel,
        messages,
        lastMessageAt: new Date(row.last_message_at),
        messageCount: parseInt(row.message_count),
        unreadCount: parseInt(row.unread_count),
      })
    }

    return threads
  }

  async getCommunicationHistory(
    customerId: string,
    options: {
      channel?: CommunicationChannel
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    } = {},
  ): Promise<CommunicationHistory[]> {
    const { channel, limit = 50, offset = 0, startDate, endDate } = options

    let whereClause = "WHERE customer_id = $1"
    const params: any[] = [customerId]
    let paramIndex = 2

    if (channel) {
      whereClause += ` AND channel = $${paramIndex}`
      params.push(channel)
      paramIndex++
    }

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    const result = await query(
      `SELECT * FROM communication_history 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
    )

    return result.rows.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      leadId: row.lead_id,
      channel: row.channel,
      direction: row.direction,
      subject: row.subject,
      content: row.content,
      templateId: row.template_id,
      campaignId: row.campaign_id,
      status: row.status,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      respondedAt: row.responded_at,
      metadata: row.metadata,
      createdAt: row.created_at,
    }))
  }

  async markAsRead(historyId: string): Promise<boolean> {
    try {
      const result = await query("UPDATE communication_history SET read_at = NOW() WHERE id = $1 AND read_at IS NULL", [
        historyId,
      ])
      return result.rowCount > 0
    } catch (error) {
      console.error("Error marking message as read:", error)
      return false
    }
  }

  async markAsResponded(historyId: string): Promise<boolean> {
    try {
      const result = await query(
        "UPDATE communication_history SET responded_at = NOW() WHERE id = $1 AND responded_at IS NULL",
        [historyId],
      )
      return result.rowCount > 0
    } catch (error) {
      console.error("Error marking message as responded:", error)
      return false
    }
  }

  async getCommunicationStats(customerId?: string, timeframe: "day" | "week" | "month" = "month") {
    let interval = "30 days"
    switch (timeframe) {
      case "day":
        interval = "1 day"
        break
      case "week":
        interval = "7 days"
        break
    }

    let whereClause = `WHERE created_at >= NOW() - INTERVAL '${interval}'`
    const params: any[] = []

    if (customerId) {
      whereClause += " AND customer_id = $1"
      params.push(customerId)
    }

    const result = await query(
      `SELECT 
        channel,
        direction,
        status,
        COUNT(*) as count
       FROM communication_history 
       ${whereClause}
       GROUP BY channel, direction, status
       ORDER BY channel, direction, status`,
      params,
    )

    const stats: Record<string, any> = {}

    result.rows.forEach((row: any) => {
      const key = `${row.channel}_${row.direction}_${row.status}`
      stats[key] = parseInt(row.count)
    })

    return stats
  }

  private async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      const result = await query("SELECT * FROM customers WHERE id = $1", [customerId])
      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        phone: row.phone,
        telegramId: row.telegram_id,
        whatsappId: row.whatsapp_id,
        lineId: row.line_id,
        firstName: row.first_name,
        lastName: row.last_name,
        preferredLanguage: row.preferred_language,
        preferredChannel: row.preferred_channel,
        status: row.status,
        leadScore: row.lead_score,
        tags: row.tags || [],
        customFields: row.custom_fields || {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }
    } catch (error) {
      console.error("Error fetching customer:", error)
      return null
    }
  }

  private getContactInfoForChannel(
    customer: Customer,
    channel: CommunicationChannel,
  ): { channel: CommunicationChannel; value: string } | null {
    switch (channel) {
      case CommunicationChannel.EMAIL:
        return { channel, value: customer.email }
      case CommunicationChannel.TELEGRAM:
        return customer.telegramId ? { channel, value: customer.telegramId } : null
      case CommunicationChannel.WHATSAPP:
        return customer.whatsappId ? { channel, value: customer.whatsappId } : null
      case CommunicationChannel.LINE:
        return customer.lineId ? { channel, value: customer.lineId } : null
      case CommunicationChannel.SMS:
      case CommunicationChannel.PHONE:
        return customer.phone ? { channel, value: customer.phone } : null
      default:
        return null
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.telegramService.stopBot()
      await this.whatsappService.destroy()
      console.log("Communication services shut down")
    } catch (error) {
      console.error("Error shutting down communication services:", error)
    }
  }
}
