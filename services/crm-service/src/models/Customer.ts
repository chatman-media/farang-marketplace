import {
  CommunicationChannel,
  CreateCustomerRequest,
  CustomerStatus,
  Customer as ICustomer,
  LeadSource,
  UpdateCustomerRequest,
} from "@marketplace/shared-types"

export class Customer implements ICustomer {
  id: string
  userId?: string
  email: string
  phone?: string
  telegramId?: string
  whatsappId?: string
  lineId?: string
  firstName: string
  lastName: string
  company?: string
  jobTitle?: string
  website?: string
  address?: any // CustomerAddress
  socialContacts?: any // Renamed from socialProfiles
  source?: LeadSource
  timezone?: string
  preferredLanguage: string
  preferredChannel: CommunicationChannel
  communicationPreferences?: any // CommunicationPreferences
  status: CustomerStatus
  leadScore: number
  tags: string[]
  customFields: Record<string, any>
  totalInteractions?: number
  lastInteractionAt?: Date
  lifetimeValue?: number
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.userId = data.user_id
    this.email = data.email
    this.phone = data.phone
    this.telegramId = data.telegram_id
    this.whatsappId = data.whatsapp_id
    this.lineId = data.line_id
    this.firstName = data.first_name
    this.lastName = data.last_name
    this.company = data.company
    this.jobTitle = data.job_title
    this.website = data.website
    this.address = data.address
    this.socialContacts = data.social_profiles // Renamed from social_profiles
    this.source = data.source
    this.timezone = data.timezone
    this.preferredLanguage = data.preferred_language || "en"
    this.preferredChannel = data.preferred_channel || CommunicationChannel.EMAIL
    this.communicationPreferences = data.communication_preferences
    this.status = data.status || CustomerStatus.LEAD
    this.leadScore = data.lead_score || 0
    this.tags = data.tags || []
    this.customFields = data.custom_fields || {}
    this.totalInteractions = data.total_interactions || 0
    this.lastInteractionAt = data.last_interaction_at ? new Date(data.last_interaction_at) : undefined
    this.lifetimeValue = data.lifetime_value
    this.createdAt = new Date(data.created_at)
    this.updatedAt = new Date(data.updated_at)
  }

  // Business logic methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  isActive(): boolean {
    return this.status !== CustomerStatus.INACTIVE && this.status !== CustomerStatus.BLOCKED
  }

  canReceiveMessages(): boolean {
    return this.isActive() && this.status !== CustomerStatus.BLOCKED
  }

  getContactInfo(): { channel: CommunicationChannel; value: string } | null {
    switch (this.preferredChannel) {
      case CommunicationChannel.EMAIL:
        return { channel: CommunicationChannel.EMAIL, value: this.email }
      case CommunicationChannel.TELEGRAM:
        return this.telegramId ? { channel: CommunicationChannel.TELEGRAM, value: this.telegramId } : null
      case CommunicationChannel.WHATSAPP:
        return this.whatsappId ? { channel: CommunicationChannel.WHATSAPP, value: this.whatsappId } : null
      case CommunicationChannel.SMS:
      case CommunicationChannel.PHONE:
        return this.phone ? { channel: this.preferredChannel, value: this.phone } : null
      default:
        return { channel: CommunicationChannel.EMAIL, value: this.email }
    }
  }

  updateLeadScore(newScore: number): void {
    this.leadScore = Math.max(0, Math.min(100, newScore))
    this.updatedAt = new Date()
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
      this.updatedAt = new Date()
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag)
    if (index > -1) {
      this.tags.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  setCustomField(key: string, value: any): void {
    this.customFields[key] = value
    this.updatedAt = new Date()
  }

  getCustomField(key: string): any {
    return this.customFields[key]
  }

  // Validation methods
  static validateCreateRequest(data: CreateCustomerRequest): string[] {
    const errors: string[] = []

    if (!data.email || !data.email.includes("@")) {
      errors.push("Valid email is required")
    }

    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push("First name is required")
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push("Last name is required")
    }

    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      errors.push("Invalid phone number format")
    }

    if (data.preferredLanguage && !/^[a-z]{2}$/.test(data.preferredLanguage)) {
      errors.push("Preferred language must be a 2-letter language code")
    }

    return errors
  }

  static validateUpdateRequest(data: UpdateCustomerRequest): string[] {
    const errors: string[] = []

    if (data.email && !data.email.includes("@")) {
      errors.push("Valid email is required")
    }

    if (data.firstName !== undefined && data.firstName.trim().length === 0) {
      errors.push("First name cannot be empty")
    }

    if (data.lastName !== undefined && data.lastName.trim().length === 0) {
      errors.push("Last name cannot be empty")
    }

    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      errors.push("Invalid phone number format")
    }

    if (data.leadScore !== undefined && (data.leadScore < 0 || data.leadScore > 100)) {
      errors.push("Lead score must be between 0 and 100")
    }

    return errors
  }

  // Convert to database format
  toDatabaseFormat(): any {
    return {
      id: this.id,
      user_id: this.userId,
      email: this.email,
      phone: this.phone,
      telegram_id: this.telegramId,
      whatsapp_id: this.whatsappId,
      line_id: this.lineId,
      first_name: this.firstName,
      last_name: this.lastName,
      company: this.company,
      job_title: this.jobTitle,
      website: this.website,
      address: this.address,
      social_profiles: this.socialContacts, // Renamed field
      source: this.source,
      timezone: this.timezone,
      preferred_language: this.preferredLanguage,
      preferred_channel: this.preferredChannel,
      communication_preferences: this.communicationPreferences,
      status: this.status,
      lead_score: this.leadScore,
      tags: this.tags,
      custom_fields: this.customFields,
      total_interactions: this.totalInteractions,
      last_interaction_at: this.lastInteractionAt,
      lifetime_value: this.lifetimeValue,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    }
  }

  // Convert to API response format
  toJSON(): ICustomer {
    return {
      id: this.id,
      userId: this.userId,
      email: this.email,
      phone: this.phone,
      telegramId: this.telegramId,
      whatsappId: this.whatsappId,
      lineId: this.lineId,
      firstName: this.firstName,
      lastName: this.lastName,
      company: this.company,
      jobTitle: this.jobTitle,
      website: this.website,
      address: this.address,
      socialContacts: this.socialContacts,
      source: this.source,
      timezone: this.timezone,
      preferredLanguage: this.preferredLanguage,
      preferredChannel: this.preferredChannel,
      communicationPreferences: this.communicationPreferences,
      status: this.status,
      leadScore: this.leadScore,
      tags: this.tags,
      customFields: this.customFields,
      totalInteractions: this.totalInteractions,
      lastInteractionAt: this.lastInteractionAt,
      lifetimeValue: this.lifetimeValue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
