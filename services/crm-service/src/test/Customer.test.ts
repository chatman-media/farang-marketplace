import { describe, it, expect, beforeEach } from "vitest"
import { Customer } from "../models/Customer"
import { CustomerStatus, CommunicationChannel } from "@marketplace/shared-types"

describe("Customer Model", () => {
  const mockCustomerData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "user-123",
    email: "test@example.com",
    phone: "+1234567890",
    telegram_id: "telegram123",
    whatsapp_id: "whatsapp123",
    first_name: "John",
    last_name: "Doe",
    preferred_language: "en",
    preferred_channel: "email",
    status: "lead",
    lead_score: 75,
    tags: ["vip", "interested"],
    custom_fields: { source: "website", budget: 5000 },
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }

  describe("Constructor", () => {
    it("should create a customer instance with all properties", () => {
      const customer = new Customer(mockCustomerData)

      expect(customer.id).toBe(mockCustomerData.id)
      expect(customer.userId).toBe(mockCustomerData.user_id)
      expect(customer.email).toBe(mockCustomerData.email)
      expect(customer.phone).toBe(mockCustomerData.phone)
      expect(customer.telegramId).toBe(mockCustomerData.telegram_id)
      expect(customer.whatsappId).toBe(mockCustomerData.whatsapp_id)
      expect(customer.firstName).toBe(mockCustomerData.first_name)
      expect(customer.lastName).toBe(mockCustomerData.last_name)
      expect(customer.preferredLanguage).toBe(mockCustomerData.preferred_language)
      expect(customer.preferredChannel).toBe(CommunicationChannel.EMAIL)
      expect(customer.status).toBe(CustomerStatus.LEAD)
      expect(customer.leadScore).toBe(mockCustomerData.lead_score)
      expect(customer.tags).toEqual(mockCustomerData.tags)
      expect(customer.customFields).toEqual(mockCustomerData.custom_fields)
    })

    it("should use default values for missing properties", () => {
      const minimalData = {
        id: "123",
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }

      const customer = new Customer(minimalData)

      expect(customer.preferredLanguage).toBe("en")
      expect(customer.preferredChannel).toBe(CommunicationChannel.EMAIL)
      expect(customer.status).toBe(CustomerStatus.LEAD)
      expect(customer.leadScore).toBe(0)
      expect(customer.tags).toEqual([])
      expect(customer.customFields).toEqual({})
    })
  })

  describe("Business Logic Methods", () => {
    let customer: Customer

    beforeEach(() => {
      customer = new Customer(mockCustomerData)
    })

    it("should return full name", () => {
      expect(customer.getFullName()).toBe("John Doe")
    })

    it("should check if customer is active", () => {
      expect(customer.isActive()).toBe(true)

      customer.status = CustomerStatus.INACTIVE
      expect(customer.isActive()).toBe(false)

      customer.status = CustomerStatus.BLOCKED
      expect(customer.isActive()).toBe(false)
    })

    it("should check if customer can receive messages", () => {
      expect(customer.canReceiveMessages()).toBe(true)

      customer.status = CustomerStatus.BLOCKED
      expect(customer.canReceiveMessages()).toBe(false)
    })

    it("should get contact info based on preferred channel", () => {
      // Email channel
      customer.preferredChannel = CommunicationChannel.EMAIL
      let contactInfo = customer.getContactInfo()
      expect(contactInfo).toEqual({
        channel: CommunicationChannel.EMAIL,
        value: "test@example.com",
      })

      // Telegram channel
      customer.preferredChannel = CommunicationChannel.TELEGRAM
      contactInfo = customer.getContactInfo()
      expect(contactInfo).toEqual({
        channel: CommunicationChannel.TELEGRAM,
        value: "telegram123",
      })

      // WhatsApp channel
      customer.preferredChannel = CommunicationChannel.WHATSAPP
      contactInfo = customer.getContactInfo()
      expect(contactInfo).toEqual({
        channel: CommunicationChannel.WHATSAPP,
        value: "whatsapp123",
      })

      // Phone channel
      customer.preferredChannel = CommunicationChannel.PHONE
      contactInfo = customer.getContactInfo()
      expect(contactInfo).toEqual({
        channel: CommunicationChannel.PHONE,
        value: "+1234567890",
      })
    })

    it("should return null for contact info when preferred channel data is missing", () => {
      customer.telegramId = undefined
      customer.preferredChannel = CommunicationChannel.TELEGRAM

      const contactInfo = customer.getContactInfo()
      expect(contactInfo).toBeNull()
    })

    it("should update lead score within valid range", () => {
      customer.updateLeadScore(85)
      expect(customer.leadScore).toBe(85)

      customer.updateLeadScore(-10)
      expect(customer.leadScore).toBe(0)

      customer.updateLeadScore(150)
      expect(customer.leadScore).toBe(100)
    })

    it("should manage tags correctly", () => {
      customer.addTag("new-tag")
      expect(customer.tags).toContain("new-tag")

      // Should not add duplicate tags
      customer.addTag("new-tag")
      expect(customer.tags.filter((tag) => tag === "new-tag")).toHaveLength(1)

      customer.removeTag("vip")
      expect(customer.tags).not.toContain("vip")

      // Should handle removing non-existent tags
      customer.removeTag("non-existent")
      expect(customer.tags).toEqual(["interested", "new-tag"])
    })

    it("should manage custom fields correctly", () => {
      customer.setCustomField("newField", "newValue")
      expect(customer.getCustomField("newField")).toBe("newValue")

      customer.setCustomField("budget", 10000)
      expect(customer.getCustomField("budget")).toBe(10000)

      expect(customer.getCustomField("nonExistent")).toBeUndefined()
    })
  })

  describe("Validation Methods", () => {
    it("should validate create request correctly", () => {
      const validRequest = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        preferredLanguage: "en",
      }

      const errors = Customer.validateCreateRequest(validRequest)
      expect(errors).toHaveLength(0)
    })

    it("should return errors for invalid create request", () => {
      const invalidRequest = {
        email: "invalid-email",
        firstName: "",
        lastName: "",
        phone: "invalid-phone",
        preferredLanguage: "invalid",
      }

      const errors = Customer.validateCreateRequest(invalidRequest)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain("Valid email is required")
      expect(errors).toContain("First name is required")
      expect(errors).toContain("Last name is required")
      expect(errors).toContain("Invalid phone number format")
      expect(errors).toContain("Preferred language must be a 2-letter language code")
    })

    it("should validate update request correctly", () => {
      const validRequest = {
        email: "updated@example.com",
        leadScore: 85,
      }

      const errors = Customer.validateUpdateRequest(validRequest)
      expect(errors).toHaveLength(0)
    })

    it("should return errors for invalid update request", () => {
      const invalidRequest = {
        email: "invalid-email",
        firstName: "",
        leadScore: 150,
      }

      const errors = Customer.validateUpdateRequest(invalidRequest)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain("Valid email is required")
      expect(errors).toContain("First name cannot be empty")
      expect(errors).toContain("Lead score must be between 0 and 100")
    })
  })

  describe("Serialization Methods", () => {
    it("should convert to database format", () => {
      const customer = new Customer(mockCustomerData)
      const dbFormat = customer.toDatabaseFormat()

      expect(dbFormat.id).toBe(mockCustomerData.id)
      expect(dbFormat.user_id).toBe(mockCustomerData.user_id)
      expect(dbFormat.first_name).toBe(mockCustomerData.first_name)
      expect(dbFormat.last_name).toBe(mockCustomerData.last_name)
      expect(dbFormat.telegram_id).toBe(mockCustomerData.telegram_id)
      expect(dbFormat.whatsapp_id).toBe(mockCustomerData.whatsapp_id)
      expect(dbFormat.preferred_language).toBe(mockCustomerData.preferred_language)
      expect(dbFormat.preferred_channel).toBe(mockCustomerData.preferred_channel)
      expect(dbFormat.lead_score).toBe(mockCustomerData.lead_score)
      expect(dbFormat.custom_fields).toBe(mockCustomerData.custom_fields)
    })

    it("should convert to JSON format", () => {
      const customer = new Customer(mockCustomerData)
      const jsonFormat = customer.toJSON()

      expect(jsonFormat.id).toBe(mockCustomerData.id)
      expect(jsonFormat.userId).toBe(mockCustomerData.user_id)
      expect(jsonFormat.firstName).toBe(mockCustomerData.first_name)
      expect(jsonFormat.lastName).toBe(mockCustomerData.last_name)
      expect(jsonFormat.telegramId).toBe(mockCustomerData.telegram_id)
      expect(jsonFormat.whatsappId).toBe(mockCustomerData.whatsapp_id)
      expect(jsonFormat.preferredLanguage).toBe(mockCustomerData.preferred_language)
      expect(jsonFormat.preferredChannel).toBe(CommunicationChannel.EMAIL)
      expect(jsonFormat.leadScore).toBe(mockCustomerData.lead_score)
      expect(jsonFormat.customFields).toBe(mockCustomerData.custom_fields)
    })
  })
})
