// AI Provider Types and Interfaces

export enum AIProvider {
  OPENAI = "openai",
  DEEPSEEK = "deepseek",
  CLAUDE = "claude",
}

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface SearchQuery {
  query: string
  filters?: {
    type?: "vehicle" | "product" | "service"
    category?: string
    priceRange?: { min: number; max: number }
    location?: string
    availability?: boolean
  }
  userContext?: {
    userId?: string
    previousSearches?: string[]
    preferences?: Record<string, any>
    location?: { latitude: number; longitude: number }
  }
  preferredProvider?: AIProvider
}

export interface SearchResult {
  id: string
  type: "vehicle" | "product" | "service"
  title: string
  description: string
  price: number
  currency: string
  location: string
  images: string[]
  rating?: number
  relevanceScore: number
  aiReason?: string // AI explanation for ranking
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  suggestions?: string[]
  filters?: Record<string, any>
  aiInsights?: {
    queryUnderstanding: string
    searchStrategy: string
    recommendations: string[]
  }
  processingTime: number
}

export interface RecommendationRequest {
  userId: string
  type: "similar" | "personalized" | "trending" | "location-based"
  context?: {
    currentItem?: string
    userHistory?: string[]
    location?: { latitude: number; longitude: number }
    preferences?: Record<string, any>
  }
  limit?: number
}

export interface RecommendationResponse {
  recommendations: SearchResult[]
  type: string
  reason: string
  confidence: number
  aiExplanation?: string
}

export interface ServiceMatchingRequest {
  requirements: {
    serviceType: string
    location: { latitude: number; longitude: number; radius?: number }
    budget?: { min: number; max: number }
    timeframe?: { start: string; end: string }
    preferences?: string[]
    specialRequirements?: string
  }
  userProfile?: {
    previousBookings?: string[]
    ratings?: number[]
    preferences?: Record<string, any>
  }
  preferredProvider?: AIProvider
}

export interface ServiceMatchingResponse {
  matches: Array<{
    providerId: string
    providerName: string
    services: string[]
    matchScore: number
    distance: number
    pricing: { min: number; max: number }
    availability: boolean
    rating: number
    aiReason: string
  }>
  searchStrategy: string
  alternatives?: string[]
}

export interface AIProviderInterface {
  // Search enhancement
  enhanceSearch(query: SearchQuery): Promise<{
    enhancedQuery: string
    searchStrategy: string
    filters: Record<string, any>
    insights: string
  }>

  // Result ranking
  rankResults(results: SearchResult[], query: SearchQuery): Promise<SearchResult[]>

  // Recommendations
  generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse>

  // Service matching
  matchServices(request: ServiceMatchingRequest): Promise<ServiceMatchingResponse>

  // Query understanding
  analyzeQuery(query: string): Promise<{
    intent: string
    entities: Record<string, any>
    suggestions: string[]
    confidence: number
  }>

  // Auto-suggestions
  generateSuggestions(partialQuery: string, context?: any): Promise<string[]>
}

export interface AIMetrics {
  provider: AIProvider
  requestCount: number
  averageResponseTime: number
  errorRate: number
  tokensUsed: number
  cost: number
  lastUsed: Date
}

export interface AIProviderConfig {
  openai?: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
  }
  deepseek?: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
  }
  claude?: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
  }
  defaultProvider: AIProvider
  fallbackProviders: AIProvider[]
  rateLimits: {
    [key in AIProvider]: {
      requestsPerMinute: number
      requestsPerDay: number
    }
  }
}

export interface AIError extends Error {
  provider: AIProvider
  code: string
  retryable: boolean
  cost?: number
}

// Prompt templates
export interface PromptTemplate {
  name: string
  template: string
  variables: string[]
  provider?: AIProvider
}

export const PROMPT_TEMPLATES = {
  SEARCH_ENHANCEMENT: {
    name: "search_enhancement",
    template: `Analyze this search query and enhance it for better results:
Query: "{query}"
User Context: {userContext}
Available Filters: {availableFilters}

Please provide:
1. Enhanced query with better keywords
2. Suggested filters to apply
3. Search strategy explanation
4. User intent analysis

Format as JSON with keys: enhancedQuery, filters, strategy, intent`,
    variables: ["query", "userContext", "availableFilters"],
  },

  RESULT_RANKING: {
    name: "result_ranking",
    template: `Rank these search results based on relevance to the query:
Query: "{query}"
User Context: {userContext}
Results: {results}

Consider:
- Query relevance
- User preferences
- Location proximity
- Price appropriateness
- Quality indicators

Return ranked results with relevance scores (0-100) and brief explanations.`,
    variables: ["query", "userContext", "results"],
  },

  RECOMMENDATIONS: {
    name: "recommendations",
    template: `Generate personalized recommendations:
User Profile: {userProfile}
Request Type: {type}
Context: {context}
Available Items: {availableItems}

Provide recommendations with:
- Relevance score
- Explanation for each recommendation
- Overall recommendation strategy`,
    variables: ["userProfile", "type", "context", "availableItems"],
  },

  SERVICE_MATCHING: {
    name: "service_matching",
    template: `Match service providers to user requirements:
Requirements: {requirements}
Available Providers: {providers}
User Profile: {userProfile}

Analyze and rank providers based on:
- Service capability match
- Location and availability
- Price compatibility
- Quality and ratings
- Special requirements fulfillment

Return matches with scores and explanations.`,
    variables: ["requirements", "providers", "userProfile"],
  },
} as const
