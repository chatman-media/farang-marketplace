import logger from "@marketplace/logger"
import { CommunicationChannel, type CommunicationHistory, type SendMessageResponse } from "@marketplace/shared-types"
import { query } from "../db/connection"

// ── Meta Cloud API client ────────────────────────────────────────────────────

interface WaMessageResponse {
  messaging_product: "whatsapp"
  messages: Array<{ id: string }>
}

class WhatsAppApiError extends Error {
  constructor(
    public method: string,
    public statusCode: number,
    public description: string,
  ) {
    super(`WhatsApp ${method} failed (${statusCode}): ${description}`)
    this.name = "WhatsAppApiError"
  }
}

class WhatsAppApiClient {
  private readonly phoneNumberId: string
  private readonly accessToken: string
  private readonly base: string

  constructor(phoneNumberId: string, accessToken: string) {
    this.phoneNumberId = phoneNumberId
    this.accessToken = accessToken
    this.base = "https://graph.facebook.com/v18.0"
  }

  private async post(path: string, body: unknown): Promise<WaMessageResponse> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new WhatsAppApiError(path, res.status, await res.text().catch(() => "no body"))
    }
    return res.json() as Promise<WaMessageResponse>
  }

  async sendText(to: string, text: string): Promise<string> {
    const r = await this.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body: text },
    })
    const id = r.messages?.[0]?.id
    if (!id) throw new WhatsAppApiError("sendText", 200, "no message id in response")
    return id
  }

  async sendTemplate(to: string, name: string, languageCode: string): Promise<string> {
    const r = await this.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name, language: { code: languageCode } },
    })
    const id = r.messages?.[0]?.id
    if (!id) throw new WhatsAppApiError("sendTemplate", 200, "no message id in response")
    return id
  }
}

// ── Webhook helpers ──────────────────────────────────────────────────────────

export interface WhatsAppVerifyResult {
  ok: boolean
  body: string
  status: number
}

export function verifyWebhookSubscription(opts: {
  mode: string | null
  token: string | null
  challenge: string | null
  expectedVerifyToken: string
}): WhatsAppVerifyResult {
  if (opts.mode !== "subscribe") return { ok: false, body: "hub.mode must be 'subscribe'", status: 400 }
  if (opts.token !== opts.expectedVerifyToken) return { ok: false, body: "verify token mismatch", status: 403 }
  if (!opts.challenge) return { ok: false, body: "hub.challenge missing", status: 400 }
  return { ok: true, body: opts.challenge, status: 200 }
}

interface WaWebhookMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WaWebhookPayload {
  object?: string
  entry?: Array<{
    changes?: Array<{
      field: string
      value?: {
        contacts?: Array<{ profile?: { name?: string }; wa_id: string }>
        messages?: WaWebhookMessage[]
      }
    }>
  }>
}

// ── Service ──────────────────────────────────────────────────────────────────

export interface SendWhatsAppRequest {
  customerId: string
  leadId?: string
  phoneNumber: string
  content: string
  templateId?: string
  templateVariables?: Record<string, string>
  channel?: CommunicationChannel
  scheduleAt?: Date
}

export class WhatsAppService {
  private client: WhatsAppApiClient | null = null

  constructor() {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    if (phoneNumberId && accessToken) {
      this.client = new WhatsAppApiClient(phoneNumberId, accessToken)
    } else {
      logger.warn("WhatsApp: WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set — channel disabled")
    }
  }

  async sendMessage(request: SendWhatsAppRequest): Promise<SendMessageResponse> {
    if (!this.client) {
      return {
        success: false,
        error: "WhatsApp not configured (missing WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)",
        channel: CommunicationChannel.WHATSAPP,
        status: "failed",
      }
    }

    try {
      let text = request.content

      if (request.templateId) {
        const tpl = await this.getTemplate(request.templateId)
        if (tpl) text = this.processTemplate(tpl.content, request.templateVariables ?? {})
      }

      const wa = this.normalizePhone(request.phoneNumber)
      const messageId = await this.client.sendText(wa, text)

      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        direction: "outbound",
        content: text,
        templateId: request.templateId,
        status: "sent",
        metadata: { messageId, phoneNumber: request.phoneNumber },
      })

      return {
        success: true,
        messageId,
        historyId,
        channel: CommunicationChannel.WHATSAPP,
        status: "sent",
        sentAt: new Date(),
      }
    } catch (error: any) {
      logger.error("WhatsApp sendMessage failed:", error)

      const historyId = await this.logCommunication({
        customerId: request.customerId,
        leadId: request.leadId,
        direction: "outbound",
        content: request.content,
        templateId: request.templateId,
        status: "failed",
        metadata: { error: error.message, phoneNumber: request.phoneNumber },
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
      results.push(await this.sendMessage({ ...request, phoneNumber }))
      await new Promise((r) => setTimeout(r, 500))
    }
    return results
  }

  /** Process an inbound webhook POST payload. Logs each incoming message to communication_history. */
  async handleWebhook(payload: WaWebhookPayload): Promise<void> {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue
        const messages = change.value?.messages ?? []
        const contacts = change.value?.contacts ?? []

        for (const msg of messages) {
          const text = msg.type === "text" ? (msg.text?.body ?? "") : `[${msg.type}]`
          const name = contacts.find((c) => c.wa_id === msg.from)?.profile?.name

          const customer = await this.findCustomerByPhone(msg.from)
          if (!customer) continue

          await this.logCommunication({
            customerId: customer.id,
            direction: "inbound",
            content: text,
            status: "received",
            metadata: { messageId: msg.id, phoneNumber: msg.from, contactName: name },
          })
        }
      }
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
      return { id: row.id, name: row.name, content: row.content, variables: row.variables || [] }
    } catch (error) {
      logger.error("Error fetching WhatsApp template:", error)
      return null
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
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
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

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "")
    // Thai numbers: 9 digits → prepend country code 66
    if (!digits.startsWith("66") && digits.length === 9) return `66${digits}`
    return digits
  }

  private processTemplate(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), v),
      template,
    )
  }

  private async findCustomerByPhone(phone: string) {
    try {
      const result = await query("SELECT id FROM customers WHERE whatsapp_id = $1", [phone])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      logger.error("Error finding customer by phone:", error)
      return null
    }
  }

  private async logCommunication(data: {
    customerId: string
    leadId?: string
    direction: "inbound" | "outbound"
    content: string
    templateId?: string
    status: string
    metadata?: Record<string, unknown>
  }): Promise<string> {
    const result = await query(
      `INSERT INTO communication_history
        (customer_id, lead_id, channel, direction, content, template_id, status, sent_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
       RETURNING id`,
      [
        data.customerId,
        data.leadId ?? null,
        CommunicationChannel.WHATSAPP,
        data.direction,
        data.content,
        data.templateId ?? null,
        data.status,
        JSON.stringify(data.metadata ?? {}),
      ],
    )
    return result.rows[0].id
  }
}
