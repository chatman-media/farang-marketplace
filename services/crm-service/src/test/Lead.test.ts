import { describe, it, expect, beforeEach } from "vitest"
import { Lead } from "../models/Lead"
import { LeadStatus, LeadPriority, LeadSource } from "@marketplace/shared-types"

describe("Lead Model", () => {
  const mockLeadData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    customer_id: "customer-123",
    listing_id: "listing-123",
    source: "website",
    status: "new",
    priority: "high",
    assigned_to: "user-123",
    value: 5000.5,
    notes: "Initial contact from website",
    follow_up_date: "2024-01-15T10:00:00Z",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  }

  describe("Constructor", () => {
    it("should create a lead instance with all properties", () => {
      const lead = new Lead(mockLeadData)

      expect(lead.id).toBe(mockLeadData.id)
      expect(lead.customerId).toBe(mockLeadData.customer_id)
      expect(lead.listingId).toBe(mockLeadData.listing_id)
      expect(lead.source).toBe(LeadSource.WEBSITE)
      expect(lead.status).toBe(LeadStatus.NEW)
      expect(lead.priority).toBe(LeadPriority.HIGH)
      expect(lead.assignedTo).toBe(mockLeadData.assigned_to)
      expect(lead.value).toBe(5000.5)
      expect(lead.notes).toBe(mockLeadData.notes)
      expect(lead.followUpDate).toEqual(new Date(mockLeadData.follow_up_date))
    })

    it("should use default values for missing properties", () => {
      const minimalData = {
        id: "123",
        customer_id: "customer-123",
        source: "website",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }

      const lead = new Lead(minimalData)

      expect(lead.status).toBe(LeadStatus.NEW)
      expect(lead.priority).toBe(LeadPriority.MEDIUM)
      expect(lead.notes).toBe("")
      expect(lead.assignedTo).toBeUndefined()
      expect(lead.value).toBeUndefined()
      expect(lead.followUpDate).toBeUndefined()
    })
  })

  describe("Business Logic Methods", () => {
    let lead: Lead

    beforeEach(() => {
      lead = new Lead(mockLeadData)
    })

    it("should check if lead is active", () => {
      expect(lead.isActive()).toBe(true)

      lead.status = LeadStatus.CLOSED_WON
      expect(lead.isActive()).toBe(false)

      lead.status = LeadStatus.CLOSED_LOST
      expect(lead.isActive()).toBe(false)
    })

    it("should check if lead is closed", () => {
      expect(lead.isClosed()).toBe(false)

      lead.status = LeadStatus.CLOSED_WON
      expect(lead.isClosed()).toBe(true)

      lead.status = LeadStatus.CLOSED_LOST
      expect(lead.isClosed()).toBe(true)
    })

    it("should check if lead is won", () => {
      expect(lead.isWon()).toBe(false)

      lead.status = LeadStatus.CLOSED_WON
      expect(lead.isWon()).toBe(true)
    })

    it("should check if lead is lost", () => {
      expect(lead.isLost()).toBe(false)

      lead.status = LeadStatus.CLOSED_LOST
      expect(lead.isLost()).toBe(true)
    })

    it("should check if lead is overdue", () => {
      // Set follow-up date in the past
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      lead.followUpDate = pastDate

      expect(lead.isOverdue()).toBe(true)

      // Set follow-up date in the future
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      lead.followUpDate = futureDate

      expect(lead.isOverdue()).toBe(false)

      // No follow-up date
      lead.followUpDate = undefined
      expect(lead.isOverdue()).toBe(false)

      // Closed leads are not overdue
      lead.followUpDate = pastDate
      lead.status = LeadStatus.CLOSED_WON
      expect(lead.isOverdue()).toBe(false)
    })

    it("should calculate days in current status", () => {
      // Mock updated_at to be 5 days ago
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      lead.updatedAt = fiveDaysAgo

      const days = lead.getDaysInCurrentStatus()
      expect(days).toBe(5)
    })

    it("should calculate lead age", () => {
      // Mock created_at to be 10 days ago
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      lead.createdAt = tenDaysAgo

      const age = lead.getAge()
      expect(age).toBe(10)
    })

    it("should update status and add notes", () => {
      const originalNotes = lead.notes
      lead.updateStatus(LeadStatus.QUALIFIED, "Customer showed interest")

      expect(lead.status).toBe(LeadStatus.QUALIFIED)
      expect(lead.notes).toContain(originalNotes)
      expect(lead.notes).toContain("Customer showed interest")
    })

    it("should not update status if it's the same", () => {
      const originalUpdatedAt = lead.updatedAt
      lead.updateStatus(LeadStatus.NEW)

      expect(lead.updatedAt).toEqual(originalUpdatedAt)
    })

    it("should set priority", () => {
      lead.setPriority(LeadPriority.URGENT)
      expect(lead.priority).toBe(LeadPriority.URGENT)
    })

    it("should assign and unassign leads", () => {
      lead.assignTo("new-user-123")
      expect(lead.assignedTo).toBe("new-user-123")

      lead.unassign()
      expect(lead.assignedTo).toBeUndefined()
    })

    it("should set follow-up date", () => {
      const newDate = new Date("2024-02-01T10:00:00Z")
      lead.setFollowUpDate(newDate)
      expect(lead.followUpDate).toEqual(newDate)
    })

    it("should add notes with timestamp", () => {
      const originalNotes = lead.notes
      lead.addNote("Follow-up call completed")

      expect(lead.notes).toContain(originalNotes)
      expect(lead.notes).toContain("Follow-up call completed")
      expect(lead.notes).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it("should set value", () => {
      lead.setValue(7500)
      expect(lead.value).toBe(7500)
    })
  })

  describe("Lead Scoring", () => {
    let lead: Lead

    beforeEach(() => {
      lead = new Lead({
        ...mockLeadData,
        source: "referral",
        priority: "urgent",
        value: 15000,
        status: "qualified",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })

    it("should calculate lead score based on various factors", () => {
      const score = lead.calculateScore()

      // Should be high score due to:
      // - Referral source (30 points)
      // - Urgent priority (25 points)
      // - High value >10000 (20 points)
      // - Qualified status (15 points)
      // - Recent lead (no age penalty)
      expect(score).toBeGreaterThan(80)
    })

    it("should apply age penalty for old leads", () => {
      // Create an old lead (45 days ago)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45)
      lead.createdAt = oldDate

      const score = lead.calculateScore()

      // Should have age penalty applied
      expect(score).toBeLessThan(90) // Some penalty for age
    })

    it("should handle leads with no value", () => {
      lead.value = undefined
      const score = lead.calculateScore()

      // Should still calculate score without value bonus
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(100)
    })
  })

  describe("Validation Methods", () => {
    it("should validate create request correctly", () => {
      const validRequest = {
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        source: LeadSource.WEBSITE,
        priority: LeadPriority.HIGH,
        value: 5000,
        followUpDate: new Date(Date.now() + 86400000), // Tomorrow
      }

      const errors = Lead.validateCreateRequest(validRequest)
      expect(errors).toHaveLength(0)
    })

    it("should return errors for invalid create request", () => {
      const invalidRequest = {
        customerId: "", // Invalid
        source: LeadSource.WEBSITE,
        value: -100, // Invalid
        followUpDate: new Date(Date.now() - 86400000), // Past date
      }

      const errors = Lead.validateCreateRequest(invalidRequest)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain("Customer ID is required")
      expect(errors).toContain("Lead value cannot be negative")
      expect(errors).toContain("Follow-up date cannot be in the past")
    })

    it("should validate update request correctly", () => {
      const validRequest = {
        status: LeadStatus.QUALIFIED,
        value: 7500,
      }

      const errors = Lead.validateUpdateRequest(validRequest)
      expect(errors).toHaveLength(0)
    })

    it("should return errors for invalid update request", () => {
      const invalidRequest = {
        value: -500,
        followUpDate: new Date(Date.now() - 86400000), // Past date
      }

      const errors = Lead.validateUpdateRequest(invalidRequest)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain("Lead value cannot be negative")
      expect(errors).toContain("Follow-up date cannot be in the past")
    })
  })

  describe("Serialization Methods", () => {
    it("should convert to database format", () => {
      const lead = new Lead(mockLeadData)
      const dbFormat = lead.toDatabaseFormat()

      expect(dbFormat.id).toBe(mockLeadData.id)
      expect(dbFormat.customer_id).toBe(mockLeadData.customer_id)
      expect(dbFormat.listing_id).toBe(mockLeadData.listing_id)
      expect(dbFormat.assigned_to).toBe(mockLeadData.assigned_to)
      expect(dbFormat.follow_up_date).toBe(lead.followUpDate)
    })

    it("should convert to JSON format", () => {
      const lead = new Lead(mockLeadData)
      const jsonFormat = lead.toJSON()

      expect(jsonFormat.id).toBe(mockLeadData.id)
      expect(jsonFormat.customerId).toBe(mockLeadData.customer_id)
      expect(jsonFormat.listingId).toBe(mockLeadData.listing_id)
      expect(jsonFormat.assignedTo).toBe(mockLeadData.assigned_to)
      expect(jsonFormat.followUpDate).toBe(lead.followUpDate)
      expect(jsonFormat.source).toBe(LeadSource.WEBSITE)
      expect(jsonFormat.status).toBe(LeadStatus.NEW)
      expect(jsonFormat.priority).toBe(LeadPriority.HIGH)
    })
  })
})
