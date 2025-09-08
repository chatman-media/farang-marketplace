import { Client, LocalAuth, Message } from "whatsapp-web.js"
import { query } from "../db/connection"
import {
  CommunicationChannel,
  SendMessageRequest,
  SendMessageResponse,
  CommunicationHistory,
} from "@marketplace/shared-types"

export interface WhatsAppConfig {
  sessionPath?: string
  puppeteerOptions?: any
}

export interface SendWhatsAppRequest extends SendMessageRequest {
  phoneNumber: string
  text?: string
  templateId?: string
  templateVariables?: Record<string, any>
  mediaUrl?: string
  mediaType?: "image" | "video" | "audio" | "document"
}

export class WhatsAppService {
  private client: Client
  private config: WhatsAppConfig
  private isReady: boolean = false

  constructor(config?: WhatsAppConfig) {
    this.config = config || {
      sessionPath: process.env.WHATSAPP_SESSION_PATH || "./whatsapp-session",
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.config.sessionPath,
      }),
      puppeteer: this.config.puppeteerOptions || {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })

    this.setupHandlers()
  }

  private setupHandlers() {
    this.client.on("qr", (qr) => {
      console.log("WhatsApp QR Code received. Please scan with your phone.")
      console.log("QR Code:", qr)
    })

    this.client.on("ready", () => {
      console.log("WhatsApp client is ready!")
      this.isReady = true
    })

    this.client.on("authenticated", () => {
      console.log("WhatsApp client authenticated")
    })

    this.client.on("auth_failure", (msg) => {
      console.error("WhatsApp authentication failed:", msg)
    })

    this.client.on("disconnected", (reason) => {
      console.log("WhatsApp client disconnected:", reason)
      this.isReady = false
    })

    this.client.on("message", async (message) => {
      await this.handleIncomingMessage(message)
    })

    this.client.on("message_ack", async (message, ack) => {
      await this.handleMessageAck(message, ack)
    })
  }

  async initialize(): Promise<void> {
    try {
      await this.client.initialize()
    } catch (error) {
      console.error("Failed to initialize WhatsApp client:", error)
      throw error
    }
  }

  async sendMessage(request: SendWhatsAppRequest): Promise<SendMessageResponse> {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      let content = request.text || request.content

      // If template is specified, load and process it
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId)
        if (template) {
          content = this.processTemplate(template.content, request.templateVariables || {})
        }
      }

      // Format phone number for WhatsApp (remove + and add @c.us)
      const chatId = this.formatPhoneNumber(request.phoneNumber)

      let sentMessage: Message

      if (request.mediaUrl) {
        // Send media message
        const { MessageMedia } = await import("whatsapp-web.js")
        const media = await MessageMedia.fromUrl(request.mediaUrl)
        sentMessage = await this.client.sendMessage(chatId, content || "", {
          media,
        })
      } else {
        // Send text message
        sentMessage = await this.client.sendMessage(chatId, content || "")
      }

      // Log communication history
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.WHATSAPP,
        direction: "outbound",
        content: content || "",
        templateId: request.templateId,

        status: "sent",
        metadata: {
          messageId: sentMessage.id._serialized,
          phoneNumber: request.phoneNumber,
          chatId,
          mediaUrl: request.mediaUrl,
          mediaType: request.mediaType,
        },
      })

      return {
        success: true,
        messageId: sentMessage.id._serialized,
        historyId,
        channel: CommunicationChannel.WHATSAPP,
        status: "sent",
        sentAt: new Date(),
      }
    } catch (error: any) {
      console.error("WhatsApp message sending failed:", error)

      // Log failed communication
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.WHATSAPP,
        direction: "outbound",
        content: request.content || "",
        templateId: request.templateId,

        status: "failed",
        metadata: {
          error: error.message,
          phoneNumber: request.phoneNumber,
        },
      })

      return {
        success: false,
        error: error.message,
        historyId,
        channel: CommunicationChannel.WHATSAPP,
        status: "failed",
      }
    }
  }

  async sendBulkMessage(
    phoneNumbers: string[],
    request: Omit<SendWhatsAppRequest, "phoneNumber">,
  ): Promise<SendMessageResponse[]> {
    const results: SendMessageResponse[] = []

    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendMessage({ ...request, phoneNumber })
      results.push(result)

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    return results
  }

  private async handleIncomingMessage(message: Message) {
    try {
      if (message.fromMe) return // Ignore messages sent by us

      const contact = await message.getContact()
      const phoneNumber = contact.number
      const content = message.body
      const messageId = message.id._serialized

      // Find customer by WhatsApp ID (phone number)
      const customer = await this.findCustomerByWhatsAppId(phoneNumber)
      if (!customer) {
        // Send welcome message for unknown users
        await message.reply("Welcome! Please register on our platform to start using our services.")
        return
      }

      // Log incoming message
      await this.logCommunication({
        customerId: customer.id,
        channel: CommunicationChannel.WHATSAPP,
        direction: "inbound",
        content,
        status: "received",
        metadata: {
          messageId,
          phoneNumber,
          contactName: contact.name || contact.pushname,
          isGroup: message.from.includes("@g.us"),
          hasMedia: message.hasMedia,
        },
      })

      // Process the message (you can add custom logic here)
      await this.processIncomingMessage(customer.id, content, message)
    } catch (error) {
      console.error("Error handling incoming WhatsApp message:", error)
    }
  }

  private async handleMessageAck(message: Message, ack: any) {
    try {
      // Update message status based on acknowledgment
      let status = "sent"
      switch (ack) {
        case 1:
          status = "sent"
          break
        case 2:
          status = "delivered"
          break
        case 3:
          status = "read"
          break
      }

      // Update communication history
      await query(
        `UPDATE communication_history 
         SET status = $1, delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END,
             read_at = CASE WHEN $1 = 'read' THEN NOW() ELSE read_at END
         WHERE metadata->>'messageId' = $2`,
        [status, message.id._serialized],
      )
    } catch (error) {
      console.error("Error handling WhatsApp message acknowledgment:", error)
    }
  }

  private async processIncomingMessage(customerId: string, content: string, message: Message) {
    // Basic auto-reply logic
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes("hello") || lowerContent.includes("hi")) {
      await message.reply("Hello! How can I help you today?")
    } else if (lowerContent.includes("help")) {
      await message.reply("I'm here to help! Please describe what you need assistance with.")
    } else {
      // Default response
      await message.reply("Thank you for your message. Our team will get back to you soon.")
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "")

    // Add country code if not present (assuming Thailand +66)
    let formatted = cleaned
    if (!formatted.startsWith("66") && formatted.length === 9) {
      formatted = "66" + formatted
    }

    return formatted + "@c.us"
  }

  private async findCustomerByWhatsAppId(whatsappId: string) {
    try {
      const result = await query("SELECT * FROM customers WHERE whatsapp_id = $1", [whatsappId])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      console.error("Error finding customer by WhatsApp ID:", error)
      return null
    }
  }

  async getTemplate(templateId: string) {
    try {
      const result = await query(
        "SELECT * FROM message_templates WHERE id = $1 AND channel = $2 AND is_active = true",
        [templateId, CommunicationChannel.WHATSAPP],
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        id: row.id,
        name: row.name,
        content: row.content,
        variables: row.variables || [],
      }
    } catch (error) {
      console.error("Error fetching WhatsApp template:", error)
      return null
    }
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
      processed = processed.replace(regex, String(value))
    })

    return processed
  }

  private async logCommunication(data: {
    customerId: string
    leadId?: string
    channel: CommunicationChannel
    direction: "inbound" | "outbound"
    content: string
    templateId?: string
    campaignId?: string
    status: string
    metadata?: Record<string, any>
  }): Promise<string> {
    const result = await query(
      `INSERT INTO communication_history (
        customer_id, lead_id, channel, direction, content,
        template_id, campaign_id, status, sent_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING id`,
      [
        data.customerId,
        data.leadId || null,
        data.channel,
        data.direction,
        data.content,
        data.templateId || null,
        data.campaignId || null,
        data.status,
        JSON.stringify(data.metadata || {}),
      ],
    )

    return result.rows[0].id
  }

  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy()
      this.isReady = false
    }
  }

  async getCommunicationHistory(
    customerId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<CommunicationHistory[]> {
    const { limit = 50, offset = 0 } = options

    const result = await query(
      `SELECT * FROM communication_history 
       WHERE customer_id = $1 AND channel = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [customerId, CommunicationChannel.WHATSAPP, limit, offset],
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

  isClientReady(): boolean {
    return this.isReady
  }
}
