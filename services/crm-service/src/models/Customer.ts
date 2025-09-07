import {
  Customer as ICustomer,
  CustomerStatus,
  CommunicationChannel,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@marketplace/shared-types"

export class Customer implements ICustomer {
  id: string
  userId?: string
  email: string
  phone?: string
  telegramId?: string
  whatsappId?: string
  firstName: string
  lastName: string
  preferredLanguage: string
  preferredChannel: CommunicationChannel
  status: CustomerStatus
  leadScore: number
  tags: string[]
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.userId = data.user_id
    this.email = data.email
    this.phone = data.phone
    this.telegramId = data.telegram_id
    this.whatsappId = data.whatsapp_id
    this.firstName = data.first_name
    this.lastName = data.last_name
    this.preferredLanguage = data.preferred_language || "en"
    this.preferredChannel = data.preferred_channel || CommunicationChannel.EMAIL
    this.status = data.status || CustomerStatus.LEAD
    this.leadScore = data.lead_score || 0
    this.tags = data.tags || []
    this.customFields = data.custom_fields || {}
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
        return this.telegramId
          ? { channel: CommunicationChannel.TELEGRAM, value: this.telegramId }
          : null
      case CommunicationChannel.WHATSAPP:
        return this.whatsappId
          ? { channel: CommunicationChannel.WHATSAPP, value: this.whatsappId }
          : null
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
      first_name: this.firstName,
      last_name: this.lastName,
      preferred_language: this.preferredLanguage,
      preferred_channel: this.preferredChannel,
      status: this.status,
      lead_score: this.leadScore,
      tags: this.tags,
      custom_fields: this.customFields,
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
      firstName: this.firstName,
      lastName: this.lastName,
      preferredLanguage: this.preferredLanguage,
      preferredChannel: this.preferredChannel,
      status: this.status,
      leadScore: this.leadScore,
      tags: this.tags,
      customFields: this.customFields,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
