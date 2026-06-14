import logger from "@marketplace/logger"
import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { verifyWebhookSubscription, WhatsAppService } from "../services/WhatsAppService"

let telegramService: any = null

export const setTelegramService = (service: any) => {
  telegramService = service
}

const whatsappService = new WhatsAppService()
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? ""

const webhookRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(import("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.headers["x-forwarded-for"]?.toString() ?? request.ip,
  })

  // Telegram webhook
  fastify.post("/telegram", async (request, reply) => {
    try {
      if (!telegramService) {
        logger.error("TelegramService is not initialized")
        return reply.code(500).send({ error: "TelegramService not initialized" })
      }
      await telegramService.bot.handleUpdate(request.body)
      return reply.code(200).send({ ok: true })
    } catch (error: any) {
      logger.error("Error processing Telegram webhook:", error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // WhatsApp webhook verification (GET) — Meta calls this on setup
  fastify.get("/whatsapp", async (request, reply) => {
    const q = request.query as Record<string, string>
    const result = verifyWebhookSubscription({
      mode: q["hub.mode"] ?? null,
      token: q["hub.verify_token"] ?? null,
      challenge: q["hub.challenge"] ?? null,
      expectedVerifyToken: WHATSAPP_VERIFY_TOKEN,
    })
    return reply.code(result.status).send(result.body)
  })

  // WhatsApp inbound messages (POST)
  fastify.post("/whatsapp", async (request, reply) => {
    try {
      await whatsappService.handleWebhook(request.body as any)
    } catch (error) {
      logger.error("Error processing WhatsApp webhook:", error)
    }
    // Always 200 — Meta retries on non-2xx
    return reply.code(200).send({ ok: true })
  })

  fastify.get("/health", async () => ({
    status: "healthy",
    webhooks: {
      telegram: telegramService ? "initialized" : "not initialized",
      whatsapp: process.env.WHATSAPP_PHONE_NUMBER_ID ? "configured" : "not configured",
    },
  }))
}

export default webhookRoutes
