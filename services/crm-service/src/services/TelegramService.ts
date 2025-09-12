import {
  CommunicationChannel,
  CommunicationHistory,
  SendMessageRequest,
  SendMessageResponse,
} from "@marketplace/shared-types"
import { Context, Telegraf } from "telegraf"
import { query } from "../db/connection"

export interface TelegramConfig {
  botToken: string
  webhookUrl?: string
}

export interface SendTelegramRequest extends SendMessageRequest {
  chatId: string
  text?: string
  parseMode?: "HTML" | "Markdown" | "MarkdownV2"
  replyMarkup?: any
  templateId?: string
  templateVariables?: Record<string, any>
}

export class TelegramService {
  private bot: Telegraf
  private config: TelegramConfig

  constructor(config?: TelegramConfig) {
    this.config = config || {
      botToken: process.env.TELEGRAM_BOT_TOKEN || "",
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    }

    if (!this.config.botToken) {
      throw new Error("Telegram bot token is required")
    }

    this.bot = new Telegraf(this.config.botToken)
    this.setupHandlers()
  }

  private setupHandlers() {
    // Handle incoming messages
    this.bot.on("text", async (ctx) => {
      await this.handleIncomingMessage(ctx)
    })

    // Handle callback queries (inline keyboard buttons)
    this.bot.on("callback_query", async (ctx) => {
      await this.handleCallbackQuery(ctx)
    })

    // Handle errors
    this.bot.catch((err, ctx) => {
      console.error("Telegram bot error:", err)
    })
  }

  async sendMessage(request: SendTelegramRequest): Promise<SendMessageResponse> {
    try {
      let content = request.text || request.content

      // If template is specified, load and process it
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId)
        if (template) {
          content = this.processTemplate(template.content, request.templateVariables || {})
        }
      }

      const messageOptions: any = {
        parse_mode: request.parseMode || "HTML",
      }

      if (request.replyMarkup) {
        messageOptions.reply_markup = request.replyMarkup
      }

      const sentMessage = await this.bot.telegram.sendMessage(request.chatId, content || "", messageOptions)

      // Log communication history
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.TELEGRAM,
        direction: "outbound",
        content: content || "",
        templateId: request.templateId,

        status: "sent",
        metadata: {
          messageId: sentMessage.message_id,
          chatId: request.chatId,
          parseMode: request.parseMode,
        },
      })

      return {
        success: true,
        messageId: sentMessage.message_id.toString(),
        historyId,
        channel: CommunicationChannel.TELEGRAM,
        status: "sent",
        sentAt: new Date(),
      }
    } catch (error: any) {
      console.error("Telegram message sending failed:", error)

      // Log failed communication
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.TELEGRAM,
        direction: "outbound",
        content: request.content || "",
        templateId: request.templateId,

        status: "failed",
        metadata: {
          error: error.message,
          chatId: request.chatId,
        },
      })

      return {
        success: false,
        error: error.message,
        historyId,
        channel: CommunicationChannel.TELEGRAM,
        status: "failed",
      }
    }
  }

  async sendBulkMessage(
    chatIds: string[],
    request: Omit<SendTelegramRequest, "chatId">,
  ): Promise<SendMessageResponse[]> {
    const results: SendMessageResponse[] = []

    for (const chatId of chatIds) {
      const result = await this.sendMessage({ ...request, chatId })
      results.push(result)

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
  }

  private async handleIncomingMessage(ctx: Context) {
    try {
      if (!ctx.message || !("text" in ctx.message)) return

      const chatId = ctx.chat?.id.toString() || ""
      const text = ctx.message.text
      const messageId = ctx.message.message_id

      // Find customer by telegram ID
      const customer = await this.findCustomerByTelegramId(chatId)
      if (!customer) {
        // Send welcome message for unknown users
        await ctx.reply("Welcome! Please register on our platform to start using our services.")
        return
      }

      // Log incoming message
      await this.logCommunication({
        customerId: customer.id,
        channel: CommunicationChannel.TELEGRAM,
        direction: "inbound",
        content: text,
        status: "received",
        metadata: {
          messageId,
          chatId,
          username: ctx.from?.username,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
        },
      })

      // Process the message (you can add custom logic here)
      await this.processIncomingMessage(customer.id, text, ctx)
    } catch (error) {
      console.error("Error handling incoming Telegram message:", error)
    }
  }

  private async handleCallbackQuery(ctx: Context) {
    try {
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return

      const chatId = ctx.chat?.id.toString()
      const data = ctx.callbackQuery.data

      // Find customer by telegram ID
      const customer = await this.findCustomerByTelegramId(chatId!)
      if (!customer) return

      // Log callback query
      await this.logCommunication({
        customerId: customer.id,
        channel: CommunicationChannel.TELEGRAM,
        direction: "inbound",
        content: `Callback: ${data}`,
        status: "received",
        metadata: {
          callbackData: data,
          chatId,
        },
      })

      // Answer callback query
      await ctx.answerCbQuery()

      // Process callback (you can add custom logic here)
      await this.processCallback(customer.id, data, ctx)
    } catch (error) {
      console.error("Error handling Telegram callback query:", error)
    }
  }

  private async processIncomingMessage(customerId: string, text: string, ctx: Context) {
    // Basic command handling
    if (text.startsWith("/start")) {
      await ctx.reply("Hello! How can I help you today?")
    } else if (text.startsWith("/help")) {
      await ctx.reply("Available commands:\n/start - Start conversation\n/help - Show this help")
    } else {
      // Echo the message for now (you can implement more sophisticated logic)
      await ctx.reply("Thank you for your message. Our team will get back to you soon.")
    }
  }

  private async processCallback(customerId: string, data: string, ctx: Context) {
    // Handle callback data (implement your business logic here)
    await ctx.reply(`You selected: ${data}`)
  }

  private async findCustomerByTelegramId(telegramId: string) {
    try {
      const result = await query("SELECT * FROM customers WHERE telegram_id = $1", [telegramId])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      console.error("Error finding customer by Telegram ID:", error)
      return null
    }
  }

  async getTemplate(templateId: string) {
    try {
      const result = await query(
        "SELECT * FROM message_templates WHERE id = $1 AND channel = $2 AND is_active = true",
        [templateId, CommunicationChannel.TELEGRAM],
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
      console.error("Error fetching Telegram template:", error)
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
    outcome?: string
    nextAction?: {
      type: string
      dueDate: Date
      assignedTo: string
      description: string
    }
    metadata?: Record<string, any>
  }): Promise<string> {
    const result = await query(
      `INSERT INTO communication_history (
        customer_id, lead_id, channel, direction, content,
        template_id, campaign_id, status, outcome, next_action, sent_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
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
        data.outcome || null,
        data.nextAction ? JSON.stringify(data.nextAction) : null,
        JSON.stringify(data.metadata || {}),
      ],
    )

    return result.rows[0].id
  }

  async startBot() {
    if (this.config.webhookUrl) {
      // Use webhook for production
      await this.bot.telegram.setWebhook(this.config.webhookUrl)
      console.log("Telegram bot webhook set:", this.config.webhookUrl)
    } else {
      // Use polling for development
      await this.bot.launch()
      console.log("Telegram bot started with polling")
    }
  }

  async stopBot() {
    this.bot.stop("SIGINT")
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
      [customerId, CommunicationChannel.TELEGRAM, limit, offset],
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
}
