import {
  CreateLeadRequest,
  Lead as ILead,
  LeadPriority,
  LeadSource,
  LeadStatus,
  UpdateLeadRequest,
} from "@marketplace/shared-types"

export class Lead implements ILead {
  id: string
  customerId: string
  listingId?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assignedTo?: string
  value?: number
  propertyInterest?: string
  estimatedValue?: number
  probability?: number
  currency?: string
  stage?: string
  campaign?: string
  medium?: string
  expectedCloseDate?: Date
  notes: string
  followUpDate?: Date
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.customerId = data.customer_id
    this.listingId = data.listing_id
    this.source = data.source
    this.status = data.status || LeadStatus.NEW
    this.priority = data.priority || LeadPriority.MEDIUM
    this.assignedTo = data.assigned_to
    this.value = data.value ? parseFloat(data.value) : undefined
    this.propertyInterest = data.property_interest
    this.estimatedValue = data.estimated_value ? parseFloat(data.estimated_value) : undefined
    this.probability = data.probability ? parseInt(data.probability) : undefined
    this.currency = data.currency || "THB"
    this.stage = data.stage
    this.campaign = data.campaign
    this.medium = data.medium
    this.expectedCloseDate = data.expected_close_date ? new Date(data.expected_close_date) : undefined
    this.notes = data.notes || ""
    this.followUpDate = data.follow_up_date ? new Date(data.follow_up_date) : undefined
    this.createdAt = new Date(data.created_at)
    this.updatedAt = new Date(data.updated_at)
  }

  // Business logic methods
  isActive(): boolean {
    return ![LeadStatus.CLOSED_WON, LeadStatus.CLOSED_LOST].includes(this.status)
  }

  isClosed(): boolean {
    return [LeadStatus.CLOSED_WON, LeadStatus.CLOSED_LOST].includes(this.status)
  }

  isWon(): boolean {
    return this.status === LeadStatus.CLOSED_WON
  }

  isLost(): boolean {
    return this.status === LeadStatus.CLOSED_LOST
  }

  isOverdue(): boolean {
    if (!this.followUpDate) return false
    return new Date() > this.followUpDate && this.isActive()
  }

  getDaysInCurrentStatus(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  getAge(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  updateStatus(newStatus: LeadStatus, notes?: string): void {
    if (this.status !== newStatus) {
      this.status = newStatus
      if (notes) {
        this.notes = this.notes ? `${this.notes}\n\n${notes}` : notes
      }
      this.updatedAt = new Date()
    }
  }

  setPriority(priority: LeadPriority): void {
    if (this.priority !== priority) {
      this.priority = priority
      this.updatedAt = new Date()
    }
  }

  assignTo(userId: string): void {
    if (this.assignedTo !== userId) {
      this.assignedTo = userId
      this.updatedAt = new Date()
    }
  }

  unassign(): void {
    if (this.assignedTo) {
      this.assignedTo = undefined
      this.updatedAt = new Date()
    }
  }

  setFollowUpDate(date: Date): void {
    this.followUpDate = date
    this.updatedAt = new Date()
  }

  addNote(note: string): void {
    const timestamp = new Date().toISOString()
    const newNote = `[${timestamp}] ${note}`
    this.notes = this.notes ? `${this.notes}\n\n${newNote}` : newNote
    this.updatedAt = new Date()
  }

  setValue(value: number): void {
    this.value = value
    this.updatedAt = new Date()
  }

  // Lead scoring based on various factors
  calculateScore(): number {
    let score = 0

    // Base score by source
    switch (this.source) {
      case LeadSource.REFERRAL:
        score += 30
        break
      case LeadSource.WEBSITE:
        score += 25
        break
      case LeadSource.DIRECT:
        score += 20
        break
      case LeadSource.SOCIAL_MEDIA:
        score += 15
        break
      case LeadSource.ADVERTISING:
        score += 10
        break
      default:
        score += 5
    }

    // Priority bonus
    switch (this.priority) {
      case LeadPriority.URGENT:
        score += 25
        break
      case LeadPriority.HIGH:
        score += 15
        break
      case LeadPriority.MEDIUM:
        score += 5
        break
      default:
        score += 0
    }

    // Value bonus
    if (this.value) {
      if (this.value > 10000) score += 20
      else if (this.value > 5000) score += 15
      else if (this.value > 1000) score += 10
      else score += 5
    }

    // Status progression bonus
    switch (this.status) {
      case LeadStatus.QUALIFIED:
        score += 15
        break
      case LeadStatus.PROPOSAL:
        score += 20
        break
      case LeadStatus.NEGOTIATION:
        score += 25
        break
      case LeadStatus.CONTACTED:
        score += 10
        break
      default:
        score += 0
    }

    // Age penalty (older leads are less likely to convert)
    const age = this.getAge()
    if (age > 30) score -= 10
    else if (age > 14) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  // Validation methods
  static validateCreateRequest(data: CreateLeadRequest): string[] {
    const errors: string[] = []

    if (!data.customerId) {
      errors.push("Customer ID is required")
    }

    if (!data.source) {
      errors.push("Lead source is required")
    }

    if (data.value !== undefined && data.value < 0) {
      errors.push("Lead value cannot be negative")
    }

    if (data.followUpDate && new Date(data.followUpDate) < new Date()) {
      errors.push("Follow-up date cannot be in the past")
    }

    return errors
  }

  static validateUpdateRequest(data: UpdateLeadRequest): string[] {
    const errors: string[] = []

    if (data.value !== undefined && data.value < 0) {
      errors.push("Lead value cannot be negative")
    }

    if (data.followUpDate && new Date(data.followUpDate) < new Date()) {
      errors.push("Follow-up date cannot be in the past")
    }

    return errors
  }

  // Convert to database format
  toDatabaseFormat(): any {
    return {
      id: this.id,
      customer_id: this.customerId,
      listing_id: this.listingId,
      source: this.source,
      status: this.status,
      priority: this.priority,
      assigned_to: this.assignedTo,
      value: this.value,
      notes: this.notes,
      follow_up_date: this.followUpDate,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    }
  }

  // Convert to API response format
  toJSON(): ILead {
    return {
      id: this.id,
      customerId: this.customerId,
      listingId: this.listingId,
      source: this.source,
      status: this.status,
      priority: this.priority,
      assignedTo: this.assignedTo,
      value: this.value,
      notes: this.notes,
      followUpDate: this.followUpDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
