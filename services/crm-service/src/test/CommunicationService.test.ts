import { CommunicationChannel } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { query } from "../db/connection"
import { CommunicationService, UnifiedSendRequest } from "../services/CommunicationService"

// Mock service methods
const mockEmailSend = vi.fn()
const mockEmailVerify = vi.fn()
const mockTelegramSend = vi.fn()
const mockTelegramStart = vi.fn()
const mockTelegramStop = vi.fn()
const mockWhatsAppSend = vi.fn()
const mockWhatsAppInit = vi.fn()
const mockWhatsAppDestroy = vi.fn()
const mockLineSend = vi.fn()

// Mock all communication services
vi.mock("../services/EmailService", () => ({
  EmailService: class {
    sendEmail = mockEmailSend
    verifyConnection = mockEmailVerify
  },
}))

vi.mock("../services/TelegramService", () => ({
  TelegramService: class {
    sendMessage = mockTelegramSend
    startBot = mockTelegramStart
    stopBot = mockTelegramStop
  },
}))

vi.mock("../services/WhatsAppService", () => ({
  WhatsAppService: class {
    sendMessage = mockWhatsAppSend
    initialize = mockWhatsAppInit
    destroy = mockWhatsAppDestroy
  },
}))

vi.mock("../services/LineService", () => ({
  LineService: class {
    sendMessage = mockLineSend
  },
}))

// Mock database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

describe("CommunicationService", () => {
  let communicationService: CommunicationService
  let mockEmailService: any
  let mockTelegramService: any
  let mockWhatsAppService: any
  let mockLineService: any
  const mockQuery = vi.mocked(query)

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock services using the shared mocks
    mockEmailService = {
      sendEmail: mockEmailSend,
      verifyConnection: mockEmailVerify,
    }

    mockTelegramService = {
      sendMessage: mockTelegramSend,
      startBot: mockTelegramStart,
      stopBot: mockTelegramStop,
    }

    mockWhatsAppService = {
      sendMessage: mockWhatsAppSend,
      initialize: mockWhatsAppInit,
      destroy: mockWhatsAppDestroy,
    }

    mockLineService = {
      sendMessage: mockLineSend,
    }

    communicationService = new CommunicationService()
  })

  describe("initialize", () => {
    it("should initialize all communication services", async () => {
      mockWhatsAppService.initialize.mockResolvedValueOnce(undefined)
      mockTelegramService.startBot.mockResolvedValueOnce(undefined)
      mockEmailService.verifyConnection.mockResolvedValueOnce(true)

      await communicationService.initialize()

      expect(mockWhatsAppService.initialize).toHaveBeenCalled()
      expect(mockTelegramService.startBot).toHaveBeenCalled()
      expect(mockEmailService.verifyConnection).toHaveBeenCalled()
    })

    it("should handle initialization failure", async () => {
      mockWhatsAppService.initialize.mockRejectedValueOnce(new Error("WhatsApp init failed"))

      await expect(communicationService.initialize()).rejects.toThrow("WhatsApp init failed")
    })
  })

  describe("sendMessage", () => {
    const mockCustomerRow = {
      id: "customer-123",
      email: "test@example.com",
      phone: "+1234567890",
      telegram_id: "telegram123",
      whatsapp_id: "+1234567890",
      line_id: "line123",
      first_name: "John",
      last_name: "Doe",
      preferred_channel: "email",
      preferred_language: "en",
      status: "active",
      lead_score: 75,
      tags: [],
      custom_fields: {},
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    }

    it("should send email message", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const mockResponse = {
        success: true,
        messageId: "email-123",
        historyId: "history-123",
        channel: CommunicationChannel.EMAIL,
        status: "sent",
        sentAt: new Date(),
      }

      mockEmailService.sendEmail.mockResolvedValueOnce(mockResponse)

      const request: UnifiedSendRequest = {
        customerId: "customer-123",
        content: "Test message",
        subject: "Test Subject",
        channel: CommunicationChannel.EMAIL,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.EMAIL,
        to: "test@example.com",
        subject: request.subject,
        content: request.content,
        templateId: request.templateId,
        templateVariables: request.templateVariables,
        scheduleAt: request.scheduleAt,
      })
    })

    it("should send telegram message", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const mockResponse = {
        success: true,
        messageId: "telegram-123",
        historyId: "history-123",
        channel: CommunicationChannel.TELEGRAM,
        status: "sent",
        sentAt: new Date(),
      }

      mockTelegramService.sendMessage.mockResolvedValueOnce(mockResponse)

      const request: UnifiedSendRequest = {
        customerId: "customer-123",
        content: "Test message",
        channel: CommunicationChannel.TELEGRAM,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.TELEGRAM,
        chatId: "telegram123",
        content: request.content,
        templateId: request.templateId,
        templateVariables: request.templateVariables,
        scheduleAt: request.scheduleAt,
      })
    })

    it("should send whatsapp message", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const mockResponse = {
        success: true,
        messageId: "whatsapp-123",
        historyId: "history-123",
        channel: CommunicationChannel.WHATSAPP,
        status: "sent",
        sentAt: new Date(),
      }

      mockWhatsAppService.sendMessage.mockResolvedValueOnce(mockResponse)

      const request: UnifiedSendRequest = {
        customerId: "customer-123",
        content: "Test message",
        channel: CommunicationChannel.WHATSAPP,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.WHATSAPP,
        phoneNumber: "+1234567890",
        content: request.content,
        templateId: request.templateId,
        templateVariables: request.templateVariables,
        scheduleAt: request.scheduleAt,
      })
    })

    it("should send line message", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const mockResponse = {
        success: true,
        messageId: "line-123",
        historyId: "history-123",
        channel: CommunicationChannel.LINE,
        status: "sent",
        sentAt: new Date(),
      }

      mockLineService.sendMessage.mockResolvedValueOnce(mockResponse)

      const request: UnifiedSendRequest = {
        customerId: "customer-123",
        content: "Test message",
        channel: CommunicationChannel.LINE,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockLineService.sendMessage).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
        channel: CommunicationChannel.LINE,
        userId: "line123",
        content: request.content,
        templateId: request.templateId,
        templateVariables: request.templateVariables,
        scheduleAt: request.scheduleAt,
      })
    })

    it("should use customer's preferred channel when not specified", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const mockResponse = {
        success: true,
        messageId: "email-123",
        historyId: "history-123",
        channel: CommunicationChannel.EMAIL,
        status: "sent",
        sentAt: new Date(),
      }

      mockEmailService.sendEmail.mockResolvedValueOnce(mockResponse)

      const request: UnifiedSendRequest = {
        customerId: "customer-123",
        content: "Test message",
        // No channel specified, should use customer's preferred channel (email)
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockEmailService.sendEmail).toHaveBeenCalled()
    })

    it("should throw error for customer not found", async () => {
      // Mock customer query to return empty result
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const request: UnifiedSendRequest = {
        customerId: "non-existent",
        content: "Test message",
      }

      await expect(communicationService.sendMessage(request)).rejects.toThrow("Customer not found")
    })

    it("should throw error for unsupported channel", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const request: UnifiedSendRequest = {
        customerId: "customer-123",
        content: "Test message",
        channel: "unsupported" as CommunicationChannel,
      }

      await expect(communicationService.sendMessage(request)).rejects.toThrow(
        "No contact information available for channel",
      )
    })
  })

  describe("sendBulkMessage", () => {
    beforeEach(() => {
      // Mock customer fetch for bulk messages
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "customer-123",
            email: "test1@example.com",
            preferred_channel: "email",
            first_name: "John",
            last_name: "Doe",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ],
      })
    })

    it("should send bulk messages to multiple customers", async () => {
      const mockResponse = {
        success: true,
        messageId: "email-123",
        historyId: "history-123",
        channel: CommunicationChannel.EMAIL,
        status: "sent",
        sentAt: new Date(),
      }

      mockEmailService.sendEmail.mockResolvedValue(mockResponse)

      const customerIds = ["customer-1", "customer-2"]
      const request: Omit<UnifiedSendRequest, "customerId"> = {
        content: "Bulk message",
        subject: "Bulk Subject",
        channel: CommunicationChannel.EMAIL,
      }

      const results = await communicationService.sendBulkMessage(customerIds, request)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual(mockResponse)
      expect(results[1]).toEqual(mockResponse)
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2)
    })

    it("should handle individual message failures in bulk send", async () => {
      mockEmailService.sendEmail
        .mockResolvedValueOnce({
          success: true,
          messageId: "email-123",
          channel: CommunicationChannel.EMAIL,
          status: "sent",
        })
        .mockRejectedValueOnce(new Error("Send failed"))

      const customerIds = ["customer-1", "customer-2"]
      const request: Omit<UnifiedSendRequest, "customerId"> = {
        content: "Bulk message",
        channel: CommunicationChannel.EMAIL,
      }

      const results = await communicationService.sendBulkMessage(customerIds, request)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe("Send failed")
    })
  })

  describe("getConversationThreads", () => {
    it("should get conversation threads for customer", async () => {
      const mockThreadData = [
        {
          channel: "email",
          message_count: "5",
          unread_count: "2",
          last_message_at: "2023-01-01T12:00:00Z",
        },
        {
          channel: "telegram",
          message_count: "3",
          unread_count: "0",
          last_message_at: "2023-01-01T10:00:00Z",
        },
      ]

      const mockMessages = [
        {
          id: "msg-1",
          customer_id: "customer-123",
          channel: "email",
          direction: "outbound",
          content: "Test message",
          created_at: "2023-01-01T12:00:00Z",
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockThreadData }).mockResolvedValue({ rows: mockMessages })

      const threads = await communicationService.getConversationThreads("customer-123")

      expect(threads).toHaveLength(2)
      expect(threads[0].channel).toBe("email")
      expect(threads[0].messageCount).toBe(5)
      expect(threads[0].unreadCount).toBe(2)
      expect(threads[1].channel).toBe("telegram")
      expect(threads[1].messageCount).toBe(3)
      expect(threads[1].unreadCount).toBe(0)
    })
  })

  describe("markAsRead", () => {
    it("should mark message as read", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      const result = await communicationService.markAsRead("history-123")

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE communication_history SET read_at = NOW()"),
        ["history-123"],
      )
    })

    it("should return false if message not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 })

      const result = await communicationService.markAsRead("non-existent")

      expect(result).toBe(false)
    })
  })

  describe("markAsResponded", () => {
    it("should mark message as responded", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      const result = await communicationService.markAsResponded("history-123")

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE communication_history SET responded_at = NOW()"),
        ["history-123"],
      )
    })

    it("should return false if message not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 })

      const result = await communicationService.markAsResponded("non-existent")

      expect(result).toBe(false)
    })

    it("should handle errors when marking as responded", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"))

      const result = await communicationService.markAsResponded("history-123")

      expect(result).toBe(false)
    })
  })

  describe("getCommunicationHistory", () => {
    const mockHistoryData = [
      {
        id: "history-1",
        customer_id: "customer-123",
        lead_id: null,
        channel: "email",
        direction: "outbound",
        subject: "Test Subject",
        content: "Test message",
        template_id: null,
        campaign_id: null,
        status: "sent",
        sent_at: "2023-01-01T12:00:00Z",
        delivered_at: null,
        read_at: null,
        responded_at: null,
        metadata: {},
        created_at: "2023-01-01T12:00:00Z",
      },
    ]

    it("should get communication history with default options", async () => {
      mockQuery.mockResolvedValueOnce({ rows: mockHistoryData })

      const history = await communicationService.getCommunicationHistory("customer-123")

      expect(history).toHaveLength(1)
      expect(history[0].id).toBe("history-1")
      expect(history[0].customerId).toBe("customer-123")
    })

    it("should filter by channel", async () => {
      mockQuery.mockResolvedValueOnce({ rows: mockHistoryData })

      await communicationService.getCommunicationHistory("customer-123", {
        channel: CommunicationChannel.EMAIL,
      })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND channel = $2"),
        expect.arrayContaining(["customer-123", CommunicationChannel.EMAIL]),
      )
    })

    it("should filter by date range", async () => {
      mockQuery.mockResolvedValueOnce({ rows: mockHistoryData })

      const startDate = new Date("2023-01-01")
      const endDate = new Date("2023-01-31")

      await communicationService.getCommunicationHistory("customer-123", {
        startDate,
        endDate,
      })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND created_at >= $2"),
        expect.arrayContaining(["customer-123", startDate, endDate]),
      )
    })

    it("should use custom limit and offset", async () => {
      mockQuery.mockResolvedValueOnce({ rows: mockHistoryData })

      await communicationService.getCommunicationHistory("customer-123", {
        limit: 10,
        offset: 20,
      })

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining(["customer-123", 10, 20]))
    })

    it("should filter by channel and date range together", async () => {
      mockQuery.mockResolvedValueOnce({ rows: mockHistoryData })

      const startDate = new Date("2023-01-01")
      const endDate = new Date("2023-01-31")

      await communicationService.getCommunicationHistory("customer-123", {
        channel: CommunicationChannel.EMAIL,
        startDate,
        endDate,
        limit: 25,
        offset: 5,
      })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND channel = $2"),
        expect.arrayContaining(["customer-123", CommunicationChannel.EMAIL, startDate, endDate, 25, 5]),
      )
    })
  })

  describe("getCommunicationStats", () => {
    it("should get stats for day timeframe", async () => {
      const mockStats = [
        { channel: "email", direction: "outbound", status: "sent", count: "10" },
        { channel: "telegram", direction: "inbound", status: "received", count: "5" },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockStats })

      const stats = await communicationService.getCommunicationStats(undefined, "day")

      expect(stats).toEqual({
        email_outbound_sent: 10,
        telegram_inbound_received: 5,
      })
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '1 day'"), [])
    })

    it("should get stats for week timeframe", async () => {
      const mockStats = [{ channel: "email", direction: "outbound", status: "sent", count: "50" }]

      mockQuery.mockResolvedValueOnce({ rows: mockStats })

      const stats = await communicationService.getCommunicationStats(undefined, "week")

      expect(stats).toEqual({
        email_outbound_sent: 50,
      })
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '7 days'"), [])
    })

    it("should get stats for month timeframe (default)", async () => {
      const mockStats = [{ channel: "email", direction: "outbound", status: "sent", count: "100" }]

      mockQuery.mockResolvedValueOnce({ rows: mockStats })

      const stats = await communicationService.getCommunicationStats(undefined, "month")

      expect(stats).toEqual({
        email_outbound_sent: 100,
      })
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INTERVAL '30 days'"), [])
    })

    it("should filter stats by customer", async () => {
      const mockStats = [{ channel: "email", direction: "outbound", status: "sent", count: "10" }]

      mockQuery.mockResolvedValueOnce({ rows: mockStats })

      const stats = await communicationService.getCommunicationStats("customer-123", "day")

      expect(stats).toEqual({
        email_outbound_sent: 10,
      })
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("AND customer_id = $1"), ["customer-123"])
    })

    it("should handle empty stats", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const stats = await communicationService.getCommunicationStats("customer-123")

      expect(stats).toEqual({})
    })
  })

  describe("shutdown", () => {
    it("should shutdown all communication services", async () => {
      mockTelegramService.stopBot.mockResolvedValueOnce(undefined)
      mockWhatsAppService.destroy.mockResolvedValueOnce(undefined)

      await communicationService.shutdown()

      expect(mockTelegramService.stopBot).toHaveBeenCalled()
      expect(mockWhatsAppService.destroy).toHaveBeenCalled()
    })

    it("should handle errors during shutdown", async () => {
      mockTelegramService.stopBot.mockRejectedValueOnce(new Error("Telegram shutdown error"))
      mockWhatsAppService.destroy.mockResolvedValueOnce(undefined)

      // Should not throw error
      await expect(communicationService.shutdown()).resolves.toBeUndefined()
    })
  })
})
