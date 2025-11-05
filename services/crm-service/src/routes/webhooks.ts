import { FastifyInstance, FastifyPluginAsync } from "fastify"
import logger from "@marketplace/logger"

// This will be set by the main app
let telegramService: any = null

export const setTelegramService = (service: any) => {
  telegramService = service
}

const webhookRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Telegram webhook endpoint
  fastify.post("/telegram", async (request, reply) => {
    try {
      if (!telegramService) {
        logger.error("TelegramService is not initialized")
        return reply.code(500).send({ error: "TelegramService not initialized" })
      }

      // Handle Telegram update
      await telegramService.bot.handleUpdate(request.body)

      return reply.code(200).send({ ok: true })
    } catch (error: any) {
      logger.error("Error processing Telegram webhook:", error)
      return reply.code(500).send({ error: "Internal server error" })
    }
  })

  // Health check for webhooks
  fastify.get("/health", async () => {
    return {
      status: "healthy",
      webhooks: {
        telegram: telegramService ? "initialized" : "not initialized",
      },
    }
  })
}

export default webhookRoutes
