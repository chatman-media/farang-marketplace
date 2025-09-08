import { Client, ClientConfig, WebhookEvent, MessageEvent, TextMessage } from "@line/bot-sdk"
import { query } from "../db/connection"
import {
  CommunicationChannel,
  SendMessageRequest,
  SendMessageResponse,
  CommunicationHistory,
} from "@marketplace/shared-types"

export interface LineConfig {
  channelAccessToken: string
  channelSecret: string
}

export interface SendLineRequest extends SendMessageRequest {
  userId: string
  text?: string
  templateId?: string
  templateVariables?: Record<string, any>
  quickReply?: any
  altText?: string
}

export class LineService {
  private client: Client
  private config: LineConfig

  constructor(config?: LineConfig) {
    this.config = config || {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
      channelSecret: process.env.LINE_CHANNEL_SECRET || "",
    }

    if (!this.config.channelAccessToken || !this.config.channelSecret) {
      if (process.env.NODE_ENV !== "test") {
        throw new Error("Line channel access token and secret are required")
      }
      // In test environment, use dummy values
      this.config.channelAccessToken = "test-token"
      this.config.channelSecret = "test-secret"
    }

    const clientConfig: ClientConfig = {
      channelAccessToken: this.config.channelAccessToken,
      channelSecret: this.config.channelSecret,
    }

    this.client = new Client(clientConfig)
  }

  async sendMessage(request: SendLineRequest): Promise<SendMessageResponse> {
    try {
      let content = request.text || request.content

      // If template is specified, load and process it
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId)
        if (template) {
          content = this.processTemplate(template.content, request.templateVariables || {})
        }
      }

      const message: TextMessage = {
        type: "text",
        text: content || "",
      }

      // Add quick reply if provided
      if (request.quickReply) {
        message.quickReply = request.quickReply
      }

      await this.client.pushMessage(request.userId, message)

      // Log communication history
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.LINE,
        direction: "outbound",
        content: content || "",
        templateId: request.templateId,

        status: "sent",
        metadata: {
          userId: request.userId,
          quickReply: request.quickReply,
        },
      })

      return {
        success: true,
        messageId: `line-${Date.now()}`, // Line doesn't return message ID for push messages
        historyId,
        channel: CommunicationChannel.LINE,
        status: "sent",
        sentAt: new Date(),
      }
    } catch (error: any) {
      console.error("Line message sending failed:", error)

      // Log failed communication
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.LINE,
        direction: "outbound",
        content: request.content || "",
        templateId: request.templateId,

        status: "failed",
        metadata: {
          error: error.message,
          userId: request.userId,
        },
      })

      return {
        success: false,
        error: error.message,
        historyId,
        channel: CommunicationChannel.LINE,
        status: "failed",
      }
    }
  }

  async sendBulkMessage(userIds: string[], request: Omit<SendLineRequest, "userId">): Promise<SendMessageResponse[]> {
    const results: SendMessageResponse[] = []

    for (const userId of userIds) {
      const result = await this.sendMessage({ ...request, userId })
      results.push(result)

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
  }

  async handleWebhook(events: WebhookEvent[]): Promise<void> {
    for (const event of events) {
      try {
        if (event.type === "message" && event.message.type === "text") {
          await this.handleTextMessage(event as MessageEvent)
        }
        // Add more event type handlers as needed
      } catch (error) {
        console.error("Error handling Line webhook event:", error)
      }
    }
  }

  private async handleTextMessage(event: MessageEvent): Promise<void> {
    try {
      const userId = event.source.userId
      if (!userId) return

      const message = event.message as TextMessage
      const text = message.text

      // Find customer by Line user ID
      const customer = await this.findCustomerByLineId(userId)
      if (!customer) {
        // Send welcome message for unknown users
        await this.client.replyMessage(event.replyToken, {
          type: "text",
          text: "Welcome! Please register on our platform to start using our services.",
        })
        return
      }

      // Log incoming message
      await this.logCommunication({
        customerId: customer.id,
        channel: CommunicationChannel.LINE,
        direction: "inbound",
        content: text,
        status: "received",
        metadata: {
          messageId: event.message?.id || "unknown",
          userId,
          replyToken: event.replyToken,
        },
      })

      // Process the message (you can add custom logic here)
      await this.processIncomingMessage(customer.id, text, event)
    } catch (error) {
      console.error("Error handling Line text message:", error)
    }
  }

  private async processIncomingMessage(customerId: string, text: string, event: MessageEvent): Promise<void> {
    // Basic auto-reply logic
    const lowerText = text.toLowerCase()

    let replyText = ""

    if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("สวัสดี")) {
      replyText = "Hello! How can I help you today? / สวัสดีครับ มีอะไรให้ช่วยไหมครับ"
    } else if (lowerText.includes("help") || lowerText.includes("ช่วย")) {
      replyText =
        "I'm here to help! Please describe what you need assistance with. / ผมพร้อมช่วยเหลือครับ กรุณาบอกว่าต้องการความช่วยเหลือเรื่องอะไร"
    } else {
      replyText =
        "Thank you for your message. Our team will get back to you soon. / ขอบคุณสำหรับข้อความครับ ทีมงานจะติดต่อกลับไปเร็วๆ นี้"
    }

    await this.client.replyMessage(event.replyToken, {
      type: "text",
      text: replyText,
    })
  }

  private async findCustomerByLineId(lineId: string) {
    try {
      const result = await query("SELECT * FROM customers WHERE line_id = $1", [lineId])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      console.error("Error finding customer by Line ID:", error)
      return null
    }
  }

  async getTemplate(templateId: string) {
    try {
      const result = await query(
        "SELECT * FROM message_templates WHERE id = $1 AND channel = $2 AND is_active = true",
        [templateId, CommunicationChannel.LINE],
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
      console.error("Error fetching Line template:", error)
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
      [customerId, CommunicationChannel.LINE, limit, offset],
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

  async verifySignature(body: string, signature: string): Promise<boolean> {
    try {
      const crypto = require("crypto")
      const hash = crypto.createHmac("sha256", this.config.channelSecret).update(body).digest("base64")

      return hash === signature
    } catch (error) {
      console.error("Error verifying Line signature:", error)
      return false
    }
  }
}
