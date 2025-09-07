import { describe, it, expect, beforeEach, vi } from "vitest"
import { CommunicationService } from "../services/CommunicationService"
import { CommunicationChannel, CustomerStatus } from "@marketplace/shared-types"

// Mock all communication services
vi.mock("../services/EmailService", () => ({
  EmailService: vi.fn(() => ({
    sendEmail: vi.fn(),
    verifyConnection: vi.fn(),
  })),
}))

vi.mock("../services/TelegramService", () => ({
  TelegramService: vi.fn(() => ({
    sendMessage: vi.fn(),
    startBot: vi.fn(),
    stopBot: vi.fn(),
  })),
}))

vi.mock("../services/WhatsAppService", () => ({
  WhatsAppService: vi.fn(() => ({
    sendMessage: vi.fn(),
    initialize: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock("../services/LineService", () => ({
  LineService: vi.fn(() => ({
    sendMessage: vi.fn(),
  })),
}))

// Mock database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

import { EmailService } from "../services/EmailService"
import { TelegramService } from "../services/TelegramService"
import { WhatsAppService } from "../services/WhatsAppService"
import { LineService } from "../services/LineService"
import { query } from "../db/connection"

describe("CommunicationService", () => {
  let communicationService: CommunicationService
  let mockEmailService: any
  let mockTelegramService: any
  let mockWhatsAppService: any
  let mockLineService: any
  const mockQuery = vi.mocked(query)

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock services
    mockEmailService = {
      sendEmail: vi.fn(),
      verifyConnection: vi.fn(),
    }

    mockTelegramService = {
      sendMessage: vi.fn(),
      startBot: vi.fn(),
      stopBot: vi.fn(),
    }

    mockWhatsAppService = {
      sendMessage: vi.fn(),
      initialize: vi.fn(),
      destroy: vi.fn(),
    }

    mockLineService = {
      sendMessage: vi.fn(),
    }

    // Mock constructors
    vi.mocked(EmailService).mockImplementation(() => mockEmailService)
    vi.mocked(TelegramService).mockImplementation(() => mockTelegramService)
    vi.mocked(WhatsAppService).mockImplementation(() => mockWhatsAppService)
    vi.mocked(LineService).mockImplementation(() => mockLineService)

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
    const mockCustomer = {
      id: "customer-123",
      email: "test@example.com",
      phone: "+1234567890",
      telegramId: "telegram123",
      whatsappId: "+1234567890",
      lineId: "line123",
      firstName: "John",
      lastName: "Doe",
      preferredChannel: CommunicationChannel.EMAIL,
      preferredLanguage: "en",
      status: CustomerStatus.ACTIVE,
      leadScore: 75,
      tags: [],
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

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

      const request = {
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

      const request = {
        customerId: "customer-123",
        content: "Test message",
        channel: CommunicationChannel.TELEGRAM,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
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

      const request = {
        customerId: "customer-123",
        content: "Test message",
        channel: CommunicationChannel.WHATSAPP,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
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

      const request = {
        customerId: "customer-123",
        content: "Test message",
        channel: CommunicationChannel.LINE,
      }

      const result = await communicationService.sendMessage(request)

      expect(result).toEqual(mockResponse)
      expect(mockLineService.sendMessage).toHaveBeenCalledWith({
        customerId: request.customerId,
        leadId: request.leadId,
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

      const request = {
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

      const request = {
        customerId: "non-existent",
        content: "Test message",
      }

      await expect(communicationService.sendMessage(request)).rejects.toThrow("Customer not found")
    })

    it("should throw error for unsupported channel", async () => {
      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomerRow] })

      const request = {
        customerId: "customer-123",
        content: "Test message",
        channel: "unsupported" as CommunicationChannel,
      }

      await expect(communicationService.sendMessage(request)).rejects.toThrow(
        "No contact information available for channel"
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
      const request = {
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
      const request = {
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

      mockQuery
        .mockResolvedValueOnce({ rows: mockThreadData })
        .mockResolvedValue({ rows: mockMessages })

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
        ["history-123"]
      )
    })

    it("should return false if message not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 })

      const result = await communicationService.markAsRead("non-existent")

      expect(result).toBe(false)
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
  })
})
