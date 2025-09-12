import {
  CommunicationChannel,
  CommunicationHistory,
  MessageTemplate,
  SendMessageRequest,
  SendMessageResponse,
} from "@marketplace/shared-types"
import * as nodemailer from "nodemailer"
import { query } from "../db/connection"

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: string[]
}

export interface SendEmailRequest extends SendMessageRequest {
  to: string
  subject: string
  html?: string
  text?: string
  templateId?: string
  templateVariables?: Record<string, any>
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  constructor(config?: EmailConfig) {
    this.config = config || {
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    })
  }

  async sendEmail(request: SendEmailRequest): Promise<SendMessageResponse> {
    try {
      let subject = request.subject
      let content = request.content

      // If template is specified, load and process it
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId)
        if (template) {
          subject = this.processTemplate(template.subject, request.templateVariables || {})
          content = this.processTemplate(template.content, request.templateVariables || {})
        }
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || this.config.auth.user,
        to: request.to,
        subject,
        html: content,
        text: request.text,
      }

      const info = await this.transporter.sendMail(mailOptions)

      // Log communication history
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.EMAIL,
        direction: "outbound",
        subject,
        content: content || "",
        templateId: request.templateId,

        status: "sent",
        metadata: {
          messageId: info.messageId,
          to: request.to,
          from: mailOptions.from,
        },
      })

      return {
        success: true,
        messageId: info.messageId,
        historyId,
        channel: CommunicationChannel.EMAIL,
        status: "sent",
        sentAt: new Date(),
      }
    } catch (error: any) {
      console.error("Email sending failed:", error)

      // Log failed communication
      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.EMAIL,
        direction: "outbound",
        subject: request.subject,
        content: request.content || "",
        templateId: request.templateId,

        status: "failed",
        metadata: {
          error: error.message,
          to: request.to,
        },
      })

      return {
        success: false,
        error: error.message,
        historyId,
        channel: CommunicationChannel.EMAIL,
        status: "failed",
      }
    }
  }

  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const result = await query(
        "SELECT * FROM message_templates WHERE id = $1 AND channel = $2 AND is_active = true",
        [templateId, CommunicationChannel.EMAIL],
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        id: row.id,
        name: row.name,
        subject: row.subject || "",
        content: row.content,
        variables: row.variables || [],
      }
    } catch (error) {
      console.error("Error fetching email template:", error)
      return null
    }
  }

  async createTemplate(template: {
    name: string
    subject: string
    content: string
    variables?: string[]
    language?: string
  }): Promise<string> {
    const result = await query(
      `INSERT INTO message_templates (name, channel, language, subject, content, variables)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        template.name,
        CommunicationChannel.EMAIL,
        template.language || "en",
        template.subject,
        template.content,
        template.variables || [],
      ],
    )

    return result.rows[0].id
  }

  async updateTemplate(
    templateId: string,
    updates: {
      name?: string
      subject?: string
      content?: string
      variables?: string[]
      isActive?: boolean
    },
  ): Promise<boolean> {
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case "isActive":
            updateFields.push(`is_active = $${paramIndex}`)
            values.push(value)
            break
          default:
            updateFields.push(`${key} = $${paramIndex}`)
            values.push(value)
        }
        paramIndex++
      }
    })

    if (updateFields.length === 0) return false

    values.push(templateId)
    const result = await query(
      `UPDATE message_templates SET ${updateFields.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex} AND channel = $${paramIndex + 1}`,
      [...values, CommunicationChannel.EMAIL],
    )

    return result.rowCount > 0
  }

  async getTemplates(language?: string): Promise<EmailTemplate[]> {
    let queryStr = "SELECT * FROM message_templates WHERE channel = $1 AND is_active = true"
    const params: any[] = [CommunicationChannel.EMAIL]

    if (language) {
      queryStr += " AND language = $2"
      params.push(language)
    }

    queryStr += " ORDER BY name"

    const result = await query(queryStr, params)

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      subject: row.subject || "",
      content: row.content,
      variables: row.variables || [],
    }))
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
    subject?: string
    content: string
    templateId?: string
    campaignId?: string
    status: string
    metadata?: Record<string, any>
  }): Promise<string> {
    const result = await query(
      `INSERT INTO communication_history (
        customer_id, lead_id, channel, direction, subject, content,
        template_id, campaign_id, status, sent_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
      RETURNING id`,
      [
        data.customerId,
        data.leadId || null,
        data.channel,
        data.direction,
        data.subject || null,
        data.content,
        data.templateId || null,
        data.campaignId || null,
        data.status,
        JSON.stringify(data.metadata || {}),
      ],
    )

    return result.rows[0].id
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error("SMTP connection verification failed:", error)
      return false
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
      [customerId, CommunicationChannel.EMAIL, limit, offset],
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
