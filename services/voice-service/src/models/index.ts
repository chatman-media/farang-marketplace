// Voice Service Models and Types

export interface VoiceRequest {
  audioData: Buffer | string // Base64 encoded audio or buffer
  language?: string
  format?: AudioFormat
  sampleRate?: number
  channels?: number
  encoding?: AudioEncoding
  userId?: string
  sessionId?: string
  context?: VoiceContext
}

export interface VoiceResponse {
  success: boolean
  transcription?: string
  confidence?: number
  language?: string
  duration?: number
  alternatives?: TranscriptionAlternative[]
  error?: string
  processingTime?: number
  provider?: string
}

export interface TranscriptionAlternative {
  text: string
  confidence: number
  words?: WordInfo[]
}

export interface WordInfo {
  word: string
  startTime: number
  endTime: number
  confidence: number
}

export interface VoiceContext {
  type: "search" | "listing" | "navigation" | "booking" | "general"
  currentPage?: string
  previousCommands?: string[]
  userPreferences?: UserVoicePreferences
}

export interface UserVoicePreferences {
  preferredLanguage: string
  speechRate?: number
  voiceGender?: "male" | "female" | "neutral"
  enableVoiceCommands: boolean
  enableVoiceSearch: boolean
  enableVoiceListingCreation: boolean
}

export interface VoiceCommand {
  id: string
  command: string
  intent: VoiceIntent
  entities: VoiceEntity[]
  confidence: number
  language: string
  userId?: string
  sessionId: string
  timestamp: Date
  context?: VoiceContext
  response?: VoiceCommandResponse
}

export interface VoiceIntent {
  name: string
  confidence: number
  parameters?: Record<string, any>
}

export interface VoiceEntity {
  type: string
  value: string
  confidence: number
  startIndex?: number
  endIndex?: number
}

export interface VoiceCommandResponse {
  action: string
  data?: any
  speechText?: string
  redirectUrl?: string
  success: boolean
  error?: string
}

export interface SpeechToTextProvider {
  name: string
  enabled: boolean
  priority: number
  config: ProviderConfig
  transcribe(request: VoiceRequest): Promise<VoiceResponse>
  isAvailable(): Promise<boolean>
  getUsage(): ProviderUsage
}

export interface ProviderConfig {
  apiKey?: string
  region?: string
  projectId?: string
  endpoint?: string
  model?: string
  language?: string
  [key: string]: any
}

export interface ProviderUsage {
  requestCount: number
  totalDuration: number
  errorCount: number
  lastUsed?: Date
  costEstimate?: number
}

export interface VoiceSearchRequest {
  query: string
  language?: string
  filters?: SearchFilters
  userId?: string
  location?: string
}

export interface SearchFilters {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
  location?: string
  rating?: number
  availability?: boolean
}

export interface VoiceListingRequest {
  title: string
  description: string
  category: string
  price?: number
  location?: string
  images?: string[]
  userId: string
  language?: string
  additionalInfo?: Record<string, any>
}

export interface AudioFormat {
  container: "wav" | "mp3" | "flac" | "ogg" | "webm" | "m4a"
  codec?: string
  bitrate?: number
  quality?: "low" | "medium" | "high"
}

export interface AudioEncoding {
  type: "LINEAR16" | "FLAC" | "MULAW" | "AMR" | "AMR_WB" | "OGG_OPUS" | "SPEEX_WITH_HEADER_BYTE" | "WEBM_OPUS"
  sampleRateHertz: number
  audioChannelCount: number
  languageCode: string
}

export interface VoiceAnalytics {
  userId?: string
  sessionId: string
  commandType: string
  intent: string
  language: string
  confidence: number
  processingTime: number
  success: boolean
  timestamp: Date
  provider: string
  audioLength?: number
  errorType?: string
}

export interface LanguageSupport {
  code: string
  name: string
  nativeName: string
  enabled: boolean
  confidence: number
  providers: string[]
}

// Voice Command Intents
export type VoiceIntentType =
  | "search"
  | "navigate"
  | "create_listing"
  | "book_service"
  | "get_info"
  | "help"
  | "cancel"
  | "confirm"
  | "repeat"
  | "unknown"

// Navigation Commands
export interface NavigationCommand {
  action: "go_to" | "back" | "forward" | "home" | "search" | "profile" | "bookings"
  target?: string
  parameters?: Record<string, any>
}

// Listing Creation Commands
export interface ListingCreationCommand {
  step: "start" | "title" | "description" | "category" | "price" | "location" | "images" | "confirm"
  data?: Partial<VoiceListingRequest>
  nextStep?: string
}

// Search Commands
export interface SearchCommand {
  query: string
  filters?: SearchFilters
  sortBy?: string
  location?: string
}

export interface VoiceSession {
  id: string
  userId?: string
  startTime: Date
  lastActivity: Date
  language: string
  context: VoiceContext
  commands: VoiceCommand[]
  state: SessionState
  metadata?: Record<string, any>
}

export interface SessionState {
  currentFlow?: "search" | "listing_creation" | "booking" | "navigation"
  step?: string
  data?: Record<string, any>
  awaitingInput?: boolean
  lastIntent?: string
}

// Error Types
export interface VoiceError {
  code: string
  message: string
  details?: any
  provider?: string
  timestamp: Date
}

export type VoiceErrorCode =
  | "AUDIO_FORMAT_UNSUPPORTED"
  | "AUDIO_TOO_LARGE"
  | "AUDIO_TOO_SHORT"
  | "LANGUAGE_NOT_SUPPORTED"
  | "PROVIDER_UNAVAILABLE"
  | "TRANSCRIPTION_FAILED"
  | "INTENT_RECOGNITION_FAILED"
  | "COMMAND_EXECUTION_FAILED"
  | "SESSION_EXPIRED"
  | "AUTHENTICATION_FAILED"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
