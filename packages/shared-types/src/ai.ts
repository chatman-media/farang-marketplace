// AI Service Types
import type { Location } from './common'

export enum MessageRole {
  USER = 'user',
  AI = 'ai',
  MANAGER = 'manager',
  SYSTEM = 'system',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  ARCHIVED = 'archived',
}

export enum AIServiceType {
  CHAT = 'chat',
  SEARCH = 'search',
  RECOMMENDATION = 'recommendation',
  VOICE = 'voice',
  TRANSLATION = 'translation',
  CONTENT_ANALYSIS = 'content_analysis',
}

export enum IntentType {
  SEARCH = 'search',
  BOOKING = 'booking',
  SUPPORT = 'support',
  INFORMATION = 'information',
  COMPLAINT = 'complaint',
  PRICE_INQUIRY = 'price_inquiry',
  AVAILABILITY = 'availability',
  GENERAL = 'general',
}

export interface MessageMetadata {
  confidence?: number
  intent?: IntentType
  entities?: Record<string, any>
  sentiment?: 'positive' | 'neutral' | 'negative'
  language?: string
  processingTime?: number
  modelUsed?: string
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  metadata?: MessageMetadata
  attachments?: MessageAttachment[]
}

export interface MessageAttachment {
  type: 'image' | 'audio' | 'document' | 'location'
  url: string
  metadata?: Record<string, any>
}

export interface ConversationContext {
  currentListing?: string
  userIntent?: IntentType
  previousBookings?: string[]
  customPrompts?: string[]
  userProfile?: {
    preferences: Record<string, any>
    history: string[]
    language: string
  }
  sessionData?: Record<string, any>
}

export interface Conversation {
  id: string
  userId: string
  channel: 'web' | 'mobile' | 'telegram' | 'whatsapp'
  messages: Message[]
  context: ConversationContext
  status: ConversationStatus
  assignedManagerId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

// AI Service Requests/Responses
export interface ChatRequest {
  message: string
  conversationId?: string
  userId?: string
  channel?: string
  language?: string
  context?: Partial<ConversationContext>
}

export interface ChatResponse {
  message: string
  conversationId: string
  suggestions?: string[]
  actions?: AIAction[]
  confidence: number
  intent?: IntentType
  requiresHuman?: boolean
}

export interface AIAction {
  type: 'search' | 'book' | 'redirect' | 'escalate' | 'collect_info'
  parameters: Record<string, any>
  label: string
}

export interface SearchRequest {
  query: string
  userId?: string
  filters?: SearchFilters
  language?: string
  location?: Location
  limit?: number
  offset?: number
}

export interface SearchFilters {
  category?: string[]
  priceRange?: { min: number; max: number }
  location?: { latitude: number; longitude: number; radius: number }
  availability?: { startDate: Date; endDate: Date }
  features?: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  suggestions?: string[]
  filters: SearchFilters
  processingTime: number
}

export interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  price: number
  location: Location
  images: string[]
  relevanceScore: number
  aiSummary?: string
}

export interface RecommendationRequest {
  userId: string
  context?: 'homepage' | 'search' | 'listing' | 'booking'
  currentListingId?: string
  limit?: number
  excludeIds?: string[]
}

export interface RecommendationResponse {
  recommendations: Recommendation[]
  reasoning: string
  confidence: number
}

export interface Recommendation {
  listingId: string
  score: number
  reason: string
  type: 'similar' | 'popular' | 'personalized' | 'trending'
}

export interface VoiceRequest {
  audioData: string // base64 encoded audio
  language?: string
  userId?: string
  conversationId?: string
}

export interface VoiceResponse {
  transcription: string
  confidence: number
  language: string
  intent?: IntentType
  followUpAction?: 'chat' | 'search' | 'booking'
}

export interface TranslationRequest {
  text: string
  fromLanguage: string
  toLanguage: string
  context?: 'listing' | 'message' | 'ui' | 'support'
}

export interface TranslationResponse {
  translatedText: string
  confidence: number
  detectedLanguage?: string
}

export interface ContentAnalysisRequest {
  content: string
  type: 'listing' | 'message' | 'review' | 'profile'
  language?: string
}

export interface ContentAnalysisResponse {
  sentiment: 'positive' | 'neutral' | 'negative'
  categories: string[]
  entities: Entity[]
  quality: number
  suggestions: string[]
  flags: ContentFlag[]
}

export interface Entity {
  text: string
  type: 'person' | 'location' | 'organization' | 'product' | 'price' | 'date'
  confidence: number
}

export interface ContentFlag {
  type: 'inappropriate' | 'spam' | 'misleading' | 'incomplete'
  severity: 'low' | 'medium' | 'high'
  reason: string
}

export interface InterventionRequest {
  conversationId: string
  message: string
  prompt?: string
  escalationReason?: string
}

export interface AIAnalytics {
  totalConversations: number
  resolvedByAI: number
  escalatedToHuman: number
  averageResponseTime: number
  userSatisfactionScore: number
  topIntents: Array<{ intent: IntentType; count: number }>
  languageDistribution: Record<string, number>
  channelDistribution: Record<string, number>
}

// AI Configuration
export interface AIConfig {
  models: {
    chat: string
    search: string
    voice: string
    translation: string
  }
  thresholds: {
    confidenceMin: number
    escalationThreshold: number
    responseTimeMax: number
  }
  features: {
    voiceEnabled: boolean
    multiLanguage: boolean
    autoTranslation: boolean
    sentimentAnalysis: boolean
  }
  prompts: {
    system: string
    welcome: Record<string, string> // language -> message
    fallback: Record<string, string>
  }
}
