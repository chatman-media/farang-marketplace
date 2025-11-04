import { CommunicationChannel } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { query } from "../db/connection"
import { EmailService } from "../services/EmailService"

// Mock transporter methods - using vi.hoisted to avoid hoisting issues
const { mockSendMail, mockVerify } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockVerify: vi.fn(),
}))

// Mock nodemailer
vi.mock("nodemailer", () => {
  const mockTransporter = {
    sendMail: mockSendMail,
    verify: mockVerify,
  }
  const mockCreateTransport = vi.fn().mockReturnValue(mockTransporter)
  return {
    default: {
      createTransport: mockCreateTransport,
    },
    createTransport: mockCreateTransport,
  }
})

// Mock database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

describe("EmailService", () => {
  let emailService: EmailService
  const mockQuery = vi.mocked(query)

  beforeEach(() => {
    vi.clearAllMocks()

    emailService = new EmailService({
      host: "smtp.test.com",
      port: 587,
      secure: false,
      auth: {
        user: "test@test.com",
        pass: "password",
      },
    })
  })

  describe("sendEmail", () => {
    it("should send email successfully", async () => {
      const mockEmailInfo = {
        messageId: "test-message-id",
        accepted: ["recipient@test.com"],
      }

      mockSendMail.mockResolvedValueOnce(mockEmailInfo)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        to: "recipient@test.com",
        subject: "Test Subject",
        content: "Test content",
        channel: CommunicationChannel.EMAIL,
      }

      const result = await emailService.sendEmail(request)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe("test-message-id")
      expect(result.channel).toBe(CommunicationChannel.EMAIL)
      expect(result.status).toBe("sent")
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "test@test.com",
        to: "recipient@test.com",
        subject: "Test Subject",
        html: "Test content",
        text: undefined,
      })
    })

    it("should send email with template", async () => {
      const mockTemplate = {
        id: "template-123",
        name: "Welcome Template",
        subject: "Welcome {{name}}!",
        content: "Hello {{name}}, welcome to our platform!",
        variables: ["name"],
      }

      const mockEmailInfo = {
        messageId: "test-message-id",
        accepted: ["recipient@test.com"],
      }

      // Mock template fetch
      mockQuery.mockResolvedValueOnce({ rows: [mockTemplate] })
      // Mock email send
      mockSendMail.mockResolvedValueOnce(mockEmailInfo)
      // Mock history log
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        to: "recipient@test.com",
        subject: "Test Subject",
        content: "Test content",
        templateId: "template-123",
        templateVariables: { name: "John Doe" },
        channel: CommunicationChannel.EMAIL,
      }

      const result = await emailService.sendEmail(request)

      expect(result.success).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "test@test.com",
        to: "recipient@test.com",
        subject: "Welcome John Doe!",
        html: "Hello John Doe, welcome to our platform!",
        text: undefined,
      })
    })

    it("should handle email sending failure", async () => {
      const error = new Error("SMTP connection failed")
      mockSendMail.mockRejectedValueOnce(error)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "history-123" }] })

      const request = {
        customerId: "customer-123",
        to: "recipient@test.com",
        subject: "Test Subject",
        content: "Test content",
        channel: CommunicationChannel.EMAIL,
      }

      const result = await emailService.sendEmail(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe("SMTP connection failed")
      expect(result.status).toBe("failed")
    })
  })

  describe("template management", () => {
    it("should create email template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "template-123" }] })

      const template = {
        name: "Welcome Email",
        subject: "Welcome {{name}}!",
        content: "Hello {{name}}, welcome!",
        variables: ["name"],
        language: "en",
      }

      const templateId = await emailService.createTemplate(template)

      expect(templateId).toBe("template-123")
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO message_templates"), [
        "Welcome Email",
        CommunicationChannel.EMAIL,
        "en",
        "Welcome {{name}}!",
        "Hello {{name}}, welcome!",
        ["name"],
      ])
    })

    it("should get email template", async () => {
      const mockTemplate = {
        id: "template-123",
        name: "Welcome Template",
        subject: "Welcome!",
        content: "Hello, welcome!",
        variables: ["name"],
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockTemplate] })

      const template = await emailService.getTemplate("template-123")

      expect(template).toEqual({
        id: "template-123",
        name: "Welcome Template",
        subject: "Welcome!",
        content: "Hello, welcome!",
        variables: ["name"],
      })
    })

    it("should return null for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const template = await emailService.getTemplate("non-existent")

      expect(template).toBeNull()
    })

    it("should update email template", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      const updates = {
        name: "Updated Template",
        subject: "Updated Subject",
        isActive: false,
      }

      const result = await emailService.updateTemplate("template-123", updates)

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE message_templates"),
        expect.arrayContaining(["Updated Template", "Updated Subject", false, "template-123"]),
      )
    })

    it("should get all templates", async () => {
      const mockTemplates = [
        {
          id: "template-1",
          name: "Template 1",
          subject: "Subject 1",
          content: "Content 1",
          variables: ["var1"],
        },
        {
          id: "template-2",
          name: "Template 2",
          subject: "Subject 2",
          content: "Content 2",
          variables: ["var2"],
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockTemplates })

      const templates = await emailService.getTemplates("en")

      expect(templates).toHaveLength(2)
      expect(templates[0].name).toBe("Template 1")
      expect(templates[1].name).toBe("Template 2")
    })
  })

  describe("verifyConnection", () => {
    it("should verify SMTP connection successfully", async () => {
      mockVerify.mockResolvedValueOnce(true)

      const result = await emailService.verifyConnection()

      expect(result).toBe(true)
      expect(mockVerify).toHaveBeenCalled()
    })

    it("should handle connection verification failure", async () => {
      mockVerify.mockRejectedValueOnce(new Error("Connection failed"))

      const result = await emailService.verifyConnection()

      expect(result).toBe(false)
    })
  })

  describe("getCommunicationHistory", () => {
    it("should get communication history for customer", async () => {
      const mockHistory = [
        {
          id: "history-1",
          customer_id: "customer-123",
          lead_id: null,
          channel: "email",
          direction: "outbound",
          subject: "Test Subject",
          content: "Test content",
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

      const history = await emailService.getCommunicationHistory("customer-123")

      expect(history).toHaveLength(1)
      expect(history[0].customerId).toBe("customer-123")
      expect(history[0].channel).toBe("email")
      expect(history[0].subject).toBe("Test Subject")
    })
  })
})
