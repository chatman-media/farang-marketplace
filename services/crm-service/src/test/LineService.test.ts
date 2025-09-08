import { describe, it, expect, beforeEach, vi } from "vitest"
import { LineService } from "../services/LineService"
import { CommunicationChannel } from "@marketplace/shared-types"

// Mock @line/bot-sdk
vi.mock("@line/bot-sdk", () => ({
  Client: vi.fn(() => ({
    pushMessage: vi.fn(),
    replyMessage: vi.fn(),
  })),
}))

// Mock database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

import { Client } from "@line/bot-sdk"
import { query } from "../db/connection"

describe("LineService", () => {
  let lineService: LineService
  const mockClient = {
    pushMessage: vi.fn(),
    replyMessage: vi.fn(),
  }
  const mockQuery = vi.mocked(query)

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Line Client constructor
    vi.mocked(Client).mockImplementation(() => mockClient as any)

    lineService = new LineService({
      channelAccessToken: "test-access-token",
      channelSecret: "test-channel-secret",
    })
  })

  describe("constructor", () => {
    it("should not throw error in test environment when access token is missing", () => {
      expect(() => {
        new LineService({
          channelAccessToken: "",
          channelSecret: "test-secret",
        })
      }).not.toThrow()
    })

    it("should not throw error in test environment when channel secret is missing", () => {
      expect(() => {
        new LineService({
          channelAccessToken: "test-token",
          channelSecret: "",
        })
      }).not.toThrow()
    })
  })

  describe("sendMessage", () => {
    it("should send Line message successfully", async () => {
      mockClient.pushMessage.mockResolvedValueOnce({})
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        userId: "line-user-123",
        content: "Test message",
        channel: CommunicationChannel.LINE,
      }

      const result = await lineService.sendMessage(request)

      expect(result.success).toBe(true)
      expect(result.channel).toBe(CommunicationChannel.LINE)
      expect(result.status).toBe("sent")
      expect(mockClient.pushMessage).toHaveBeenCalledWith("line-user-123", {
        type: "text",
        text: "Test message",
      })
    })

    it("should send Line message with template", async () => {
      const mockTemplate = {
        id: "template-123",
        name: "Welcome Template",
        content: "Hello {{name}}, welcome to our platform!",
        variables: ["name"],
      }

      // Mock template fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockTemplate] })
      // Mock message send
      mockClient.pushMessage.mockResolvedValueOnce({})
      // Mock history log
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        userId: "line-user-123",
        content: "Test message",
        templateId: "template-123",
        templateVariables: { name: "John Doe" },
        channel: CommunicationChannel.LINE,
      }

      const result = await lineService.sendMessage(request)

      expect(result.success).toBe(true)
      expect(mockClient.pushMessage).toHaveBeenCalledWith("line-user-123", {
        type: "text",
        text: "Hello John Doe, welcome to our platform!",
      })
    })

    it("should send Line message with quick reply", async () => {
      const quickReply = {
        items: [
          {
            type: "action",
            action: {
              type: "message",
              label: "Yes",
              text: "Yes",
            },
          },
          {
            type: "action",
            action: {
              type: "message",
              label: "No",
              text: "No",
            },
          },
        ],
      }

      mockClient.pushMessage.mockResolvedValueOnce({})
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        userId: "line-user-123",
        content: "Do you want to continue?",
        quickReply,
        channel: CommunicationChannel.LINE,
      }

      const result = await lineService.sendMessage(request)

      expect(result.success).toBe(true)
      expect(mockClient.pushMessage).toHaveBeenCalledWith("line-user-123", {
        type: "text",
        text: "Do you want to continue?",
        quickReply,
      })
    })

    it("should handle Line message sending failure", async () => {
      const error = new Error("Line API error")
      mockClient.pushMessage.mockRejectedValueOnce(error)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        userId: "line-user-123",
        content: "Test message",
        channel: CommunicationChannel.LINE,
      }

      const result = await lineService.sendMessage(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Line API error")
      expect(result.status).toBe("failed")
    })
  })

  describe("sendBulkMessage", () => {
    it("should send bulk messages to multiple users", async () => {
      mockClient.pushMessage.mockResolvedValue({})
      mockQuery.mockResolvedValue({ rows: [{ id: "history-123" }] })

      const userIds = ["user-1", "user-2"]
      const request = {
        customerId: "customer-123",
        content: "Bulk message",
        channel: CommunicationChannel.LINE,
      }

      const results = await lineService.sendBulkMessage(userIds, request)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(mockClient.pushMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe("handleWebhook", () => {
    it("should handle text message event", async () => {
      const mockCustomer = {
        id: "customer-123",
        first_name: "John",
        last_name: "Doe",
      }

      // Mock customer fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockCustomer] })
      // Mock history log
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })
      // Mock reply
      mockClient.replyMessage.mockResolvedValueOnce({})

      const events = [
        {
          type: "message",
          replyToken: "reply-token-123",
          source: {
            userId: "line-user-123",
            type: "user",
          },
          message: {
            id: "message-123",
            type: "text",
            text: "Hello",
          },
          timestamp: Date.now(),
          mode: "active",
        },
      ]

      await lineService.handleWebhook(events as any)

      expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM customers WHERE line_id = $1", ["line-user-123"])
      expect(mockClient.replyMessage).toHaveBeenCalledWith("reply-token-123", {
        type: "text",
        text: "Hello! How can I help you today? / สวัสดีครับ มีอะไรให้ช่วยไหมครับ",
      })
    })

    it("should handle unknown user", async () => {
      // Mock customer not found
      mockQuery.mockResolvedValueOnce({ rows: [] })
      // Mock welcome message
      mockClient.replyMessage.mockResolvedValueOnce({})

      const events = [
        {
          type: "message",
          replyToken: "reply-token-123",
          source: {
            userId: "unknown-user",
            type: "user",
          },
          message: {
            id: "message-123",
            type: "text",
            text: "Hello",
          },
          timestamp: Date.now(),
          mode: "active",
        },
      ]

      await lineService.handleWebhook(events as any)

      expect(mockClient.replyMessage).toHaveBeenCalledWith("reply-token-123", {
        type: "text",
        text: "Welcome! Please register on our platform to start using our services.",
      })
    })
  })

  describe("getTemplate", () => {
    it("should get Line template", async () => {
      const mockTemplate = {
        id: "template-123",
        name: "Welcome Template",
        content: "Hello, welcome!",
        variables: ["name"],
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockTemplate] })

      const template = await lineService.getTemplate("template-123")

      expect(template).toEqual({
        id: "template-123",
        name: "Welcome Template",
        content: "Hello, welcome!",
        variables: ["name"],
      })
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM message_templates WHERE id = $1 AND channel = $2 AND is_active = true",
        ["template-123", CommunicationChannel.LINE],
      )
    })

    it("should return null for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const template = await lineService.getTemplate("non-existent")

      expect(template).toBeNull()
    })
  })

  describe("getCommunicationHistory", () => {
    it("should get communication history for customer", async () => {
      const mockHistory = [
        {
          id: "history-1",
          customer_id: "customer-123",
          lead_id: null,
          channel: "line",
          direction: "outbound",
          subject: null,
          content: "Test message",
          template_id: null,
          campaign_id: null,
          status: "sent",
          sent_at: "2023-01-01T10:00:00Z",
          delivered_at: null,
          read_at: null,
          responded_at: null,
          metadata: {},
          created_at: "2023-01-01T10:00:00Z",
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockHistory })

      const history = await lineService.getCommunicationHistory("customer-123")

      expect(history).toHaveLength(1)
      expect(history[0].customerId).toBe("customer-123")
      expect(history[0].channel).toBe("line")
      expect(history[0].content).toBe("Test message")
    })
  })

  describe("verifySignature", () => {
    it("should verify Line webhook signature", async () => {
      const body = '{"events":[]}'
      const signature = "test-signature"

      // For this test, we'll just verify that the method doesn't throw an error
      // and returns a boolean. The actual crypto verification is tested in integration tests.
      const result = await lineService.verifySignature(body, signature)

      expect(typeof result).toBe("boolean")
    })
  })
})
