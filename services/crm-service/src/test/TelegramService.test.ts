import { CommunicationChannel } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { query } from "../db/connection"
import { TelegramService } from "../services/TelegramService"

// Mock telegraf - using vi.hoisted to define mocks before vi.mock
const { mockSendMessage, mockSetWebhook, mockLaunch, mockStop, mockOn, mockCatch, MockTelegraf } = vi.hoisted(() => {
  const sendMessage = vi.fn()
  const setWebhook = vi.fn()
  const launch = vi.fn()
  const stop = vi.fn()
  const on = vi.fn().mockReturnThis()
  const catchFn = vi.fn().mockReturnThis()

  class Telegraf {
    telegram = {
      sendMessage,
      setWebhook,
    }
    on = on
    catch = catchFn
    launch = launch
    stop = stop
  }

  return {
    mockSendMessage: sendMessage,
    mockSetWebhook: setWebhook,
    mockLaunch: launch,
    mockStop: stop,
    mockOn: on,
    mockCatch: catchFn,
    MockTelegraf: Telegraf,
  }
})

vi.mock("telegraf", () => ({
  Telegraf: MockTelegraf,
}))

// Mock database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

describe("TelegramService", () => {
  let telegramService: TelegramService
  const mockQuery = vi.mocked(query)

  beforeEach(() => {
    vi.clearAllMocks()

    telegramService = new TelegramService({
      botToken: "test-bot-token",
    })
  })

  describe("constructor", () => {
    it("should throw error if bot token is not provided", () => {
      expect(() => new TelegramService({ botToken: "" })).toThrow("Telegram bot token is required")
    })

    it("should initialize with config", () => {
      expect(telegramService).toBeDefined()
      expect(mockOn).toHaveBeenCalled()
      expect(mockCatch).toHaveBeenCalled()
    })
  })

  describe("sendMessage", () => {
    it("should send message successfully", async () => {
      const mockSentMessage = {
        message_id: 12345,
        chat: { id: 123 },
        text: "Test message",
      }

      mockSendMessage.mockResolvedValueOnce(mockSentMessage)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        chatId: "123456",
        content: "Test message",
        channel: CommunicationChannel.TELEGRAM,
      }

      const result = await telegramService.sendMessage(request)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe("12345")
      expect(result.channel).toBe(CommunicationChannel.TELEGRAM)
      expect(result.status).toBe("sent")
      expect(mockSendMessage).toHaveBeenCalledWith("123456", "Test message", {
        parse_mode: "HTML",
      })
    })

    it("should send message with template", async () => {
      const mockTemplate = {
        id: "template-123",
        name: "Welcome Template",
        content: "Hello {{name}}, welcome!",
        variables: ["name"],
      }

      const mockSentMessage = {
        message_id: 12345,
        chat: { id: 123 },
        text: "Hello John, welcome!",
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTemplate] }) // getTemplate
        .mockResolvedValueOnce({ rows: [{ id: "history-123" }] }) // logCommunication

      mockSendMessage.mockResolvedValueOnce(mockSentMessage)

      const request = {
        customerId: "customer-123",
        chatId: "123456",
        templateId: "template-123",
        templateVariables: { name: "John" },
        channel: CommunicationChannel.TELEGRAM,
      }

      const result = await telegramService.sendMessage(request)

      expect(result.success).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledWith("123456", "Hello John, welcome!", {
        parse_mode: "HTML",
      })
    })

    it("should send message with custom parse mode and reply markup", async () => {
      const mockSentMessage = {
        message_id: 12345,
        chat: { id: 123 },
        text: "Test message",
      }

      mockSendMessage.mockResolvedValueOnce(mockSentMessage)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const replyMarkup = {
        inline_keyboard: [[{ text: "Button", callback_data: "button_1" }]],
      }

      const request = {
        customerId: "customer-123",
        chatId: "123456",
        content: "Test message",
        parseMode: "Markdown" as const,
        replyMarkup,
        channel: CommunicationChannel.TELEGRAM,
      }

      const result = await telegramService.sendMessage(request)

      expect(result.success).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledWith("123456", "Test message", {
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      })
    })

    it("should handle failed message sending", async () => {
      const error = new Error("Failed to send message")
      mockSendMessage.mockRejectedValueOnce(error)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        chatId: "123456",
        content: "Test message",
        channel: CommunicationChannel.TELEGRAM,
      }

      const result = await telegramService.sendMessage(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to send message")
      expect(result.status).toBe("failed")
    })
  })

  describe("sendBulkMessage", () => {
    it("should send bulk messages successfully", async () => {
      const mockSentMessage = {
        message_id: 12345,
        chat: { id: 123 },
        text: "Test message",
      }

      mockSendMessage.mockResolvedValue(mockSentMessage)
      mockQuery.mockResolvedValue({ rows: [{ id: "history-123" }] })

      const chatIds = ["123", "456", "789"]
      const request = {
        customerId: "customer-123",
        content: "Bulk message",
        channel: CommunicationChannel.TELEGRAM,
      }

      const results = await telegramService.sendBulkMessage(chatIds, request)

      expect(results).toHaveLength(3)
      expect(results.every((r) => r.success)).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledTimes(3)
    })
  })

  describe("getTemplate", () => {
    it("should get template successfully", async () => {
      const mockTemplate = {
        id: "template-123",
        name: "Test Template",
        content: "Hello {{name}}",
        variables: ["name"],
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockTemplate] })

      const template = await telegramService.getTemplate("template-123")

      expect(template).toEqual({
        id: "template-123",
        name: "Test Template",
        content: "Hello {{name}}",
        variables: ["name"],
      })
    })

    it("should return null if template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const template = await telegramService.getTemplate("non-existent")

      expect(template).toBeNull()
    })

    it("should handle database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"))

      const template = await telegramService.getTemplate("template-123")

      expect(template).toBeNull()
    })
  })

  describe("startBot", () => {
    it("should start bot with webhook in production", async () => {
      const serviceWithWebhook = new TelegramService({
        botToken: "test-bot-token",
        webhookUrl: "https://example.com/webhook",
      })

      mockSetWebhook.mockResolvedValueOnce(true)

      await serviceWithWebhook.startBot()

      expect(mockSetWebhook).toHaveBeenCalledWith("https://example.com/webhook")
    })

    it("should start bot with polling in development", async () => {
      mockLaunch.mockResolvedValueOnce(undefined)

      await telegramService.startBot()

      expect(mockLaunch).toHaveBeenCalled()
    })
  })

  describe("stopBot", () => {
    it("should stop bot", async () => {
      await telegramService.stopBot()

      expect(mockStop).toHaveBeenCalledWith("SIGINT")
    })
  })

  describe("getCommunicationHistory", () => {
    it("should get communication history", async () => {
      const mockHistory = [
        {
          id: "history-1",
          customer_id: "customer-123",
          lead_id: null,
          channel: "telegram",
          direction: "outbound",
          subject: null,
          content: "Test message",
          template_id: null,
          campaign_id: null,
          status: "sent",
          sent_at: new Date(),
          delivered_at: null,
          read_at: null,
          responded_at: null,
          metadata: {},
          created_at: new Date(),
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockHistory })

      const history = await telegramService.getCommunicationHistory("customer-123")

      expect(history).toHaveLength(1)
      expect(history[0].id).toBe("history-1")
      expect(history[0].customerId).toBe("customer-123")
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM communication_history"), [
        "customer-123",
        CommunicationChannel.TELEGRAM,
        50,
        0,
      ])
    })

    it("should get communication history with custom limit and offset", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await telegramService.getCommunicationHistory("customer-123", { limit: 10, offset: 20 })

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM communication_history"), [
        "customer-123",
        CommunicationChannel.TELEGRAM,
        10,
        20,
      ])
    })
  })
})
