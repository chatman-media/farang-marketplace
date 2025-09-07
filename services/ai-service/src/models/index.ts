// User Behavior and Preferences
export interface UserBehavior {
  id: string
  userId: string
  action: "view" | "search" | "click" | "bookmark" | "share" | "contact" | "book" | "purchase"
  entityType: "listing" | "service" | "agency" | "user"
  entityId: string
  metadata: Record<string, any>
  sessionId: string
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
    city?: string
    country?: string
  }
  device?: {
    type: "mobile" | "tablet" | "desktop"
    os?: string
    browser?: string
  }
}

export interface UserPreferences {
  id: string
  userId: string
  categories: string[]
  priceRange: {
    min: number
    max: number
    currency: string
  }
  locations: string[]
  languages: string[]
  features: string[]
  excludeCategories: string[]
  notificationSettings: {
    email: boolean
    push: boolean
    sms: boolean
    frequency: "immediate" | "daily" | "weekly" | "monthly"
  }
  privacySettings: {
    shareData: boolean
    personalizedAds: boolean
    behaviorTracking: boolean
  }
  updatedAt: Date
  createdAt: Date
}

// Recommendation Models
export interface RecommendationRequest {
  userId: string
  type: "listings" | "services" | "agencies" | "users"
  context?: {
    currentListingId?: string
    searchQuery?: string
    category?: string
    location?: string
    budget?: number
  }
  filters?: {
    categories?: string[]
    priceRange?: { min: number; max: number }
    location?: string
    rating?: number
    availability?: boolean
  }
  limit?: number
  diversityFactor?: number
}

export interface RecommendationResult {
  id: string
  type: "listing" | "service" | "agency" | "user"
  score: number
  confidence: number
  reasons: string[]
  metadata: Record<string, any>
  rank: number
}

export interface RecommendationResponse {
  userId: string
  requestId: string
  results: RecommendationResult[]
  totalResults: number
  algorithm: string
  processingTime: number
  cacheHit: boolean
  timestamp: Date
}

// Content Analysis Models
export interface ContentAnalysisRequest {
  id: string
  type: "listing" | "review" | "message" | "profile"
  content: {
    title?: string
    description?: string
    text?: string
    images?: string[]
  }
  language?: string
  options: {
    sentiment?: boolean
    keywords?: boolean
    categories?: boolean
    language?: boolean
    moderation?: boolean
    quality?: boolean
  }
}

export interface ContentAnalysisResult {
  id: string
  sentiment?: {
    score: number // -1 to 1
    label: "negative" | "neutral" | "positive"
    confidence: number
  }
  keywords?: Array<{
    word: string
    score: number
    category?: string
  }>
  categories?: Array<{
    category: string
    confidence: number
  }>
  language?: {
    detected: string
    confidence: number
  }
  moderation?: {
    flagged: boolean
    categories: string[]
    scores: Record<string, number>
  }
  quality?: {
    score: number // 0 to 1
    issues: string[]
    suggestions: string[]
  }
  processingTime: number
  timestamp: Date
}

// Machine Learning Models
export interface MLModel {
  id: string
  name: string
  type: "recommendation" | "classification" | "regression" | "clustering"
  version: string
  status: "training" | "ready" | "error" | "deprecated"
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  trainingData: {
    samples: number
    features: number
    lastTrained: Date
  }
  hyperparameters: Record<string, any>
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface TrainingJob {
  id: string
  modelId: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: number // 0 to 100
  startTime?: Date
  endTime?: Date
  metrics?: {
    loss: number
    accuracy: number
    validationLoss: number
    validationAccuracy: number
  }
  logs: string[]
  error?: string
  config: {
    epochs: number
    batchSize: number
    learningRate: number
    validationSplit: number
  }
}

// Search and Query Models
export interface SearchQuery {
  id: string
  userId?: string
  query: string
  type: "text" | "voice" | "image" | "semantic"
  filters?: Record<string, any>
  location?: {
    latitude: number
    longitude: number
    radius?: number
  }
  language?: string
  timestamp: Date
  sessionId: string
}

export interface SearchResult {
  queryId: string
  results: Array<{
    id: string
    type: "listing" | "service" | "agency" | "user"
    score: number
    relevance: number
    rank: number
    snippet?: string
    highlights?: string[]
    metadata: Record<string, any>
  }>
  totalResults: number
  processingTime: number
  algorithm: string
  suggestions?: string[]
  corrections?: string[]
  timestamp: Date
}

// Analytics and Insights
export interface UserInsight {
  userId: string
  type: "preference" | "behavior" | "prediction" | "segment"
  insight: string
  confidence: number
  evidence: string[]
  actionable: boolean
  recommendations: string[]
  validUntil?: Date
  createdAt: Date
}

export interface MarketInsight {
  id: string
  type: "trend" | "demand" | "pricing" | "competition" | "opportunity"
  category?: string
  location?: string
  insight: string
  impact: "low" | "medium" | "high"
  confidence: number
  data: Record<string, any>
  recommendations: string[]
  validUntil?: Date
  createdAt: Date
}

// AI Provider Models
export interface AIProviderConfig {
  name: string
  type: "openai" | "deepseek" | "claude" | "custom"
  apiKey: string
  baseUrl?: string
  model: string
  maxTokens: number
  temperature: number
  enabled: boolean
  priority: number
  rateLimit: {
    requests: number
    window: number // seconds
  }
  cost: {
    inputTokens: number // cost per 1k tokens
    outputTokens: number // cost per 1k tokens
  }
}

export interface AIRequest {
  id: string
  provider: string
  model: string
  prompt: string
  maxTokens: number
  temperature: number
  metadata: Record<string, any>
  timestamp: Date
}

export interface AIResponse {
  requestId: string
  provider: string
  model: string
  response: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  processingTime: number
  cached: boolean
  timestamp: Date
}

// Error and Monitoring Models
export interface AIError {
  id: string
  type: "provider" | "model" | "rate_limit" | "timeout" | "validation" | "system"
  provider?: string
  model?: string
  message: string
  details: Record<string, any>
  requestId?: string
  userId?: string
  retryable: boolean
  timestamp: Date
}

export interface PerformanceMetric {
  id: string
  service: string
  operation: string
  duration: number
  success: boolean
  error?: string
  metadata: Record<string, any>
  timestamp: Date
}
