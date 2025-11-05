import Fastify, { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import webhookRoutes, { setTelegramService } from "../routes/webhooks"

describe("Webhook Routes", () => {
  let fastify: FastifyInstance
  let mockTelegramService: any

  beforeEach(async () => {
    fastify = Fastify()

    mockTelegramService = {
      bot: {
        handleUpdate: vi.fn(),
      },
    }

    await fastify.register(webhookRoutes, { prefix: "/webhooks" })
    await fastify.ready()
  })

  afterEach(async () => {
    await fastify.close()
    vi.clearAllMocks()
  })

  describe("POST /webhooks/telegram", () => {
    it("should handle telegram webhook successfully", async () => {
      setTelegramService(mockTelegramService)

      const update = {
        update_id: 12345,
        message: {
          message_id: 1,
          from: {
            id: 123456,
            first_name: "Test User",
            username: "testuser",
          },
          chat: {
            id: 123456,
            type: "private",
          },
          text: "Hello bot",
        },
      }

      mockTelegramService.bot.handleUpdate.mockResolvedValueOnce(undefined)

      const response = await fastify.inject({
        method: "POST",
        url: "/webhooks/telegram",
        payload: update,
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ ok: true })
      expect(mockTelegramService.bot.handleUpdate).toHaveBeenCalledWith(update)
    })

    it("should return 500 if TelegramService not initialized", async () => {
      setTelegramService(null)

      const update = {
        update_id: 12345,
        message: { text: "Test" },
      }

      const response = await fastify.inject({
        method: "POST",
        url: "/webhooks/telegram",
        payload: update,
      })

      expect(response.statusCode).toBe(500)
      expect(JSON.parse(response.body)).toEqual({ error: "TelegramService not initialized" })
    })

    it("should handle webhook processing errors", async () => {
      setTelegramService(mockTelegramService)

      mockTelegramService.bot.handleUpdate.mockRejectedValueOnce(new Error("Processing error"))

      const update = {
        update_id: 12345,
        message: { text: "Test" },
      }

      const response = await fastify.inject({
        method: "POST",
        url: "/webhooks/telegram",
        payload: update,
      })

      expect(response.statusCode).toBe(500)
      expect(JSON.parse(response.body)).toEqual({ error: "Internal server error" })
    })

    it("should handle different types of telegram updates", async () => {
      setTelegramService(mockTelegramService)

      // Test callback query update
      const callbackUpdate = {
        update_id: 12346,
        callback_query: {
          id: "callback-123",
          from: { id: 123456, first_name: "Test" },
          message: {
            message_id: 1,
            chat: { id: 123456 },
          },
          data: "button_clicked",
        },
      }

      mockTelegramService.bot.handleUpdate.mockResolvedValueOnce(undefined)

      const response = await fastify.inject({
        method: "POST",
        url: "/webhooks/telegram",
        payload: callbackUpdate,
      })

      expect(response.statusCode).toBe(200)
      expect(mockTelegramService.bot.handleUpdate).toHaveBeenCalledWith(callbackUpdate)
    })

    it("should handle edited messages", async () => {
      setTelegramService(mockTelegramService)

      const editedUpdate = {
        update_id: 12347,
        edited_message: {
          message_id: 1,
          from: { id: 123456, first_name: "Test" },
          chat: { id: 123456 },
          text: "Edited text",
          edit_date: Math.floor(Date.now() / 1000),
        },
      }

      mockTelegramService.bot.handleUpdate.mockResolvedValueOnce(undefined)

      const response = await fastify.inject({
        method: "POST",
        url: "/webhooks/telegram",
        payload: editedUpdate,
      })

      expect(response.statusCode).toBe(200)
      expect(mockTelegramService.bot.handleUpdate).toHaveBeenCalledWith(editedUpdate)
    })
  })

  describe("GET /webhooks/health", () => {
    it("should return healthy status when telegram service is initialized", async () => {
      setTelegramService(mockTelegramService)

      const response = await fastify.inject({
        method: "GET",
        url: "/webhooks/health",
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        status: "healthy",
        webhooks: {
          telegram: "initialized",
        },
      })
    })

    it("should return not initialized status when telegram service is null", async () => {
      setTelegramService(null)

      const response = await fastify.inject({
        method: "GET",
        url: "/webhooks/health",
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        status: "healthy",
        webhooks: {
          telegram: "not initialized",
        },
      })
    })

    it("should return correct status after service is set", async () => {
      // First check without service
      setTelegramService(null)

      let response = await fastify.inject({
        method: "GET",
        url: "/webhooks/health",
      })

      expect(JSON.parse(response.body).webhooks.telegram).toBe("not initialized")

      // Then set service and check again
      setTelegramService(mockTelegramService)

      response = await fastify.inject({
        method: "GET",
        url: "/webhooks/health",
      })

      expect(JSON.parse(response.body).webhooks.telegram).toBe("initialized")
    })
  })
})
