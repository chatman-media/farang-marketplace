// CRM and Customer Management Types

export interface CustomerAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface CustomerSocialProfiles {
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  youtube?: string
  tiktok?: string
}

export interface CommunicationPreferences {
  email?: boolean
  sms?: boolean
  telegram?: boolean
  whatsapp?: boolean
  line?: boolean
  phone?: boolean
  marketing?: boolean
  transactional?: boolean
  frequency?: "daily" | "weekly" | "monthly" | "never"
  timezone?: string
}

export interface Customer {
  id: string
  userId?: string // Link to platform user if exists
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
  address?: CustomerAddress
  socialContacts?: CustomerSocialProfiles // Renamed from socialProfiles to avoid conflicts
  source?: LeadSource
  timezone?: string
  preferredLanguage: string
  preferredChannel: CommunicationChannel
  communicationPreferences?: CommunicationPreferences
  status: CustomerStatus
  leadScore: number
  tags: string[]
  customFields: Record<string, any>
  totalInteractions?: number
  lastInteractionAt?: Date
  lifetimeValue?: number
  createdAt: Date
  updatedAt: Date
}

export interface Lead {
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
  probability?: number // 0-100
  currency?: string
  stage?: string
  campaign?: string
  medium?: string
  expectedCloseDate?: Date
  notes: string
  followUpDate?: Date
  createdAt: Date
  updatedAt: Date
}

export enum InteractionOutcome {
  SUCCESSFUL = "SUCCESSFUL",
  FAILED = "FAILED",
  NO_ANSWER = "NO_ANSWER",
  SCHEDULED_FOLLOWUP = "SCHEDULED_FOLLOWUP",
}

export interface NextAction {
  type: string
  dueDate: Date
  assignedTo: string
  description: string
}

export interface CommunicationHistory {
  id: string
  customerId: string
  leadId?: string
  channel: CommunicationChannel
  direction: CommunicationDirection
  subject?: string
  content: string
  templateId?: string
  campaignId?: string
  status: MessageStatus
  outcome?: InteractionOutcome
  nextAction?: NextAction
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  respondedAt?: Date
  metadata: Record<string, any>
  createdAt: Date
}

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  channels: CommunicationChannel[]
  targetSegment: CustomerSegment
  messages: CampaignMessage[]
  triggers: CampaignTrigger[]
  schedule?: CampaignSchedule
  contactCount: number
  analytics: CampaignAnalytics
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CampaignMessage {
  id: string
  channel: CommunicationChannel
  templateId: string
  delay: number // minutes after trigger
  conditions?: MessageCondition[]
}

export interface MessageTemplate {
  id: string
  name: string
  channel: CommunicationChannel
  language: string
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Automation {
  id: string
  name: string
  description: string
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Enums
export enum CustomerStatus {
  LEAD = "lead",
  PROSPECT = "prospect",
  CUSTOMER = "customer",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  CLOSED_WON = "closed_won",
  CLOSED_LOST = "closed_lost",
}

export enum LeadPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum LeadSource {
  WEBSITE = "website",
  TELEGRAM = "telegram",
  WHATSAPP = "whatsapp",
  EMAIL = "email",
  REFERRAL = "referral",
  SOCIAL_MEDIA = "social_media",
  DIRECT = "direct",
  ADVERTISING = "advertising",
}

export enum CommunicationChannel {
  EMAIL = "email",
  TELEGRAM = "telegram",
  WHATSAPP = "whatsapp",
  LINE = "line",
  SMS = "sms",
  PHONE = "phone",
  IN_APP = "in_app",
}

export enum CommunicationDirection {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export enum MessageStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  RESPONDED = "responded",
  FAILED = "failed",
  BOUNCED = "bounced",
}

export enum CampaignType {
  WELCOME = "welcome",
  NURTURE = "nurture",
  PROMOTIONAL = "promotional",
  FOLLOW_UP = "follow_up",
  REACTIVATION = "reactivation",
  ABANDONED_CART = "abandoned_cart",
}

export enum CampaignStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

// Supporting interfaces
export interface CustomerSegment {
  criteria: SegmentCriteria[]
  operator: "AND" | "OR"
}

export interface SegmentCriteria {
  field: string
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in"
  value: any
}

export interface CampaignTrigger {
  type: "event" | "time" | "condition"
  event?: string
  schedule?: CampaignSchedule
  condition?: AutomationCondition
}

export interface CampaignSchedule {
  startDate: Date
  endDate?: Date
  timezone: string
  frequency?: "once" | "daily" | "weekly" | "monthly"
  daysOfWeek?: number[]
  timeOfDay?: string
}

export interface CampaignAnalytics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  responded: number
  unsubscribed: number
  bounced: number
  conversionRate: number
  roi?: number
}

export interface MessageCondition {
  field: string
  operator: string
  value: any
}

export interface AutomationTrigger {
  type: "lead_created" | "lead_updated" | "customer_registered" | "booking_created" | "custom_event"
  event?: string
  conditions?: AutomationCondition[]
}

export interface AutomationCondition {
  field: string
  operator: string
  value: any
}

export interface AutomationAction {
  type: "send_message" | "update_lead" | "assign_lead" | "create_task" | "webhook"
  parameters: Record<string, any>
}

// API Request/Response types
export interface CreateCustomerRequest {
  email: string
  phone?: string
  telegramId?: string
  whatsappId?: string
  lineId?: string
  userId?: string
  firstName: string
  lastName: string
  company?: string
  jobTitle?: string
  website?: string
  address?: CustomerAddress
  socialProfiles?: CustomerSocialProfiles
  source?: LeadSource
  timezone?: string
  preferredLanguage?: string
  preferredChannel?: CommunicationChannel
  communicationPreferences?: CommunicationPreferences
  tags?: string[]
  customFields?: Record<string, any>
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  status?: CustomerStatus
  leadScore?: number
  totalInteractions?: number
  lastInteractionAt?: Date
  lifetimeValue?: number
}

export interface CreateLeadRequest {
  customerId: string
  listingId?: string
  source: LeadSource
  priority?: LeadPriority
  value?: number
  propertyInterest?: string
  estimatedValue?: number
  probability?: number
  currency?: string
  stage?: string
  campaign?: string
  medium?: string
  expectedCloseDate?: Date
  notes?: string
  followUpDate?: Date
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: LeadStatus
  assignedTo?: string
}

export interface SendMessageRequest {
  customerId: string
  leadId?: string
  channel: CommunicationChannel
  templateId?: string
  content?: string
  subject?: string
  variables?: Record<string, any>
  scheduleAt?: Date
}

export interface CreateCampaignRequest {
  name: string
  type: CampaignType
  channels: CommunicationChannel[]
  targetSegment: CustomerSegment
  messages: Omit<CampaignMessage, "id">[]
  triggers: CampaignTrigger[]
  schedule?: CampaignSchedule
}

export interface CRMAnalytics {
  totalCustomers: number
  totalLeads: number
  conversionRate: number
  averageLeadScore: number
  leadsByStatus: Record<LeadStatus, number>
  customersByStatus: Record<CustomerStatus, number>
  messagesSent: number
  messagesDelivered: number
  responseRate: number
  topPerformingCampaigns: Campaign[]
  recentActivity: CommunicationHistory[]
}

// Communication Service Types
export interface SendMessageResponse {
  success: boolean
  messageId?: string
  historyId?: string
  channel?: CommunicationChannel
  status: string
  sentAt?: Date
  error?: string
}

export interface SendEmailRequest {
  customerId: string
  leadId?: string
  channel: CommunicationChannel
  to: string
  subject: string
  content: string
  templateId?: string
  templateVariables?: Record<string, any>
  campaignId?: string
  priority?: LeadPriority
  scheduleAt?: Date
}

export interface SendTelegramRequest {
  customerId: string
  leadId?: string
  channel: CommunicationChannel
  chatId: string
  content: string
  templateId?: string
  templateVariables?: Record<string, any>
  campaignId?: string
  priority?: LeadPriority
  scheduleAt?: Date
  quickReplies?: string[]
}

export interface SendWhatsAppRequest {
  customerId: string
  leadId?: string
  channel: CommunicationChannel
  phoneNumber: string
  content: string
  templateId?: string
  templateVariables?: Record<string, any>
  campaignId?: string
  priority?: LeadPriority
  scheduleAt?: Date
  mediaUrl?: string
}

export interface SendLineRequest {
  customerId: string
  leadId?: string
  channel: CommunicationChannel
  userId: string
  content: string
  templateId?: string
  templateVariables?: Record<string, any>
  campaignId?: string
  priority?: LeadPriority
  scheduleAt?: Date
  quickReplies?: string[]
}

export interface UnifiedSendRequest {
  customerId: string
  leadId?: string
  content: string
  subject?: string
  channel?: CommunicationChannel
  templateId?: string
  templateVariables?: Record<string, any>
  campaignId?: string
  priority?: LeadPriority
  scheduleAt?: Date
}
