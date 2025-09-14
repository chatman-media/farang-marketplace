import logger from "@marketplace/logger"
import { Matrix } from "ml-matrix"

import type {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationResult,
  UserBehavior,
  UserPreferences,
} from "../models/index"

import { AIProviderService } from "./AIProviderService"

export interface ItemFeatures {
  id: string
  type: "listing" | "service" | "agency" | "user"
  features: number[]
  metadata: Record<string, any>
  categories: string[]
  location?: {
    latitude: number
    longitude: number
    city?: string
  }
  rating?: number
  price?: number
  popularity?: number
  recency?: number
}

export interface UserProfile {
  id: string
  features: number[]
  preferences: UserPreferences
  behaviors: UserBehavior[]
  segments: string[]
  lastUpdated: Date
}

export class RecommendationEngine {
  private aiProvider: AIProviderService
  private userProfiles: Map<string, UserProfile> = new Map()
  private itemFeatures: Map<string, ItemFeatures> = new Map()
  private similarityMatrix: Matrix | null = null
  private modelVersion = "1.0.0"

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider
  }

  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now()
    const requestId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Get or create user profile
      const userProfile = await this.getUserProfile(request.userId)

      // Get candidate items
      const candidates = await this.getCandidateItems(request)

      // Store candidates in itemFeatures map for filtering
      candidates.forEach((item) => {
        this.itemFeatures.set(item.id, item)
      })

      // Calculate scores using multiple algorithms
      const scores = await this.calculateScores(userProfile, candidates, request)

      // Apply diversity and filtering
      const filteredResults = this.applyDiversityAndFiltering(scores, request)

      // Sort and limit results
      const finalResults = filteredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, request.limit || 50)
        .map((result, index) => ({ ...result, rank: index + 1 }))

      const processingTime = Date.now() - startTime

      return {
        userId: request.userId,
        requestId,
        results: finalResults,
        totalResults: finalResults.length,
        algorithm: "hybrid_ml_ai",
        processingTime,
        cacheHit: false,
        timestamp: new Date(),
      }
    } catch (error) {
      logger.error("Error generating recommendations:", error)
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get or create user profile
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId)

    if (!profile || this.isProfileStale(profile)) {
      profile = await this.buildUserProfile(userId)
      this.userProfiles.set(userId, profile)
    }

    return profile
  }

  /**
   * Build user profile from behavior and preferences
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // In a real implementation, this would fetch from database
    const mockBehaviors: UserBehavior[] = []
    const mockPreferences: UserPreferences = {
      id: `pref_${userId}`,
      userId,
      categories: ["electronics", "home"],
      priceRange: { min: 0, max: 10000, currency: "THB" },
      locations: ["Bangkok", "Phuket"],
      languages: ["th", "en"],
      features: ["delivery", "warranty"],
      excludeCategories: [],
      notificationSettings: {
        email: true,
        push: true,
        sms: false,
        frequency: "daily",
      },
      privacySettings: {
        shareData: true,
        personalizedAds: true,
        behaviorTracking: true,
      },
      updatedAt: new Date(),
      createdAt: new Date(),
    }

    // Extract features from behaviors and preferences
    const features = this.extractUserFeatures(mockBehaviors, mockPreferences)

    // Determine user segments
    const segments = this.determineUserSegments(mockBehaviors, mockPreferences)

    return {
      id: userId,
      features,
      preferences: mockPreferences,
      behaviors: mockBehaviors,
      segments,
      lastUpdated: new Date(),
    }
  }

  /**
   * Extract numerical features from user data
   */
  private extractUserFeatures(behaviors: UserBehavior[], preferences: UserPreferences): number[] {
    const features: number[] = []

    // Category preferences (one-hot encoding for top categories)
    const topCategories = ["electronics", "home", "fashion", "automotive", "services"]
    topCategories.forEach((category) => {
      features.push(preferences.categories.includes(category) ? 1 : 0)
    })

    // Price sensitivity
    features.push(Math.log(preferences.priceRange.max + 1) / 10) // Normalized log price

    // Location preferences
    const topLocations = ["Bangkok", "Phuket", "Chiang Mai", "Pattaya"]
    topLocations.forEach((location) => {
      features.push(preferences.locations.includes(location) ? 1 : 0)
    })

    // Behavior patterns
    const actionCounts = behaviors.reduce(
      (acc, behavior) => {
        acc[behavior.action] = (acc[behavior.action] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const totalActions = behaviors.length || 1
    features.push((actionCounts["view"] || 0) / totalActions)
    features.push((actionCounts["click"] || 0) / totalActions)
    features.push((actionCounts["book"] || 0) / totalActions)
    features.push((actionCounts["purchase"] || 0) / totalActions)

    // Recency of activity
    const lastActivity = behaviors.length > 0 ? Math.max(...behaviors.map((b) => b.timestamp.getTime())) : Date.now()
    const daysSinceLastActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24)
    features.push(Math.exp(-daysSinceLastActivity / 30)) // Exponential decay

    return features
  }

  /**
   * Determine user segments based on behavior and preferences
   */
  private determineUserSegments(behaviors: UserBehavior[], preferences: UserPreferences): string[] {
    const segments: string[] = []

    // Price-based segments
    if (preferences.priceRange.max > 50000) {
      segments.push("high_value")
    } else if (preferences.priceRange.max < 5000) {
      segments.push("budget_conscious")
    } else {
      segments.push("mid_market")
    }

    // Activity-based segments
    const recentBehaviors = behaviors.filter(
      (b) => Date.now() - b.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000, // Last 7 days
    )

    if (recentBehaviors.length > 20) {
      segments.push("highly_active")
    } else if (recentBehaviors.length > 5) {
      segments.push("moderately_active")
    } else {
      segments.push("low_activity")
    }

    // Category-based segments
    if (preferences.categories.includes("electronics")) {
      segments.push("tech_enthusiast")
    }
    if (preferences.categories.includes("home")) {
      segments.push("home_improver")
    }

    return segments
  }

  /**
   * Get candidate items for recommendation
   */
  private async getCandidateItems(request: RecommendationRequest): Promise<ItemFeatures[]> {
    // In a real implementation, this would fetch from database with filters
    const mockItems: ItemFeatures[] = []

    // Generate mock items for testing
    for (let i = 0; i < 100; i++) {
      const categories = ["electronics", "home", "fashion", "automotive", "services"]
      const randomCategory = categories[Math.floor(Math.random() * categories.length)] || "electronics"

      mockItems.push({
        id: `item_${i}`,
        type: request.type === "listings" ? "listing" : "service",
        features: this.generateItemFeatures(randomCategory),
        metadata: {
          title: `Sample ${randomCategory} item ${i}`,
          description: `Description for ${randomCategory} item ${i}`,
          category: randomCategory,
          viewCount: Math.floor(Math.random() * 500),
          bookingCount: Math.floor(Math.random() * 50),
        },
        categories: [randomCategory],
        location: {
          latitude: 13.7563 + (Math.random() - 0.5) * 2,
          longitude: 100.5018 + (Math.random() - 0.5) * 2,
          city: "Bangkok",
        },
        rating: 3 + Math.random() * 2,
        price: Math.random() * 50000,
        popularity: Math.random(),
        recency: Math.random(),
      })
    }

    return mockItems
  }

  /**
   * Generate item features based on category
   */
  private generateItemFeatures(category: string): number[] {
    const features: number[] = []

    // Category one-hot encoding
    const categories = ["electronics", "home", "fashion", "automotive", "services"]
    categories.forEach((cat) => {
      features.push(cat === category ? 1 : 0)
    })

    // Random features for price, quality, popularity, etc.
    features.push(Math.random()) // Price tier
    features.push(Math.random()) // Quality score
    features.push(Math.random()) // Popularity
    features.push(Math.random()) // Recency
    features.push(Math.random()) // Availability

    return features
  }

  /**
   * Calculate recommendation scores using multiple algorithms
   */
  private async calculateScores(
    userProfile: UserProfile,
    candidates: ItemFeatures[],
    request: RecommendationRequest,
  ): Promise<RecommendationResult[]> {
    const results: RecommendationResult[] = []

    for (const item of candidates) {
      // Collaborative filtering score
      const cfScore = this.calculateCollaborativeFilteringScore(userProfile, item)

      // Content-based score
      const cbScore = this.calculateContentBasedScore(userProfile, item)

      // Context-aware score
      const contextScore = this.calculateContextScore(item, request)

      // AI-enhanced score
      const aiScore = await this.calculateAIScore(userProfile, item, request)

      // Combine scores with weights
      const finalScore = cfScore * 0.3 + cbScore * 0.3 + contextScore * 0.2 + aiScore * 0.2

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(userProfile, item)

      // Generate reasons for recommendation
      const reasons = this.generateReasons(userProfile, item, {
        cf: cfScore,
        cb: cbScore,
        context: contextScore,
        ai: aiScore,
      })

      results.push({
        id: item.id,
        type: item.type,
        score: finalScore,
        confidence,
        reasons,
        metadata: item.metadata,
        rank: 0, // Will be set later
      })
    }

    return results
  }

  /**
   * Calculate collaborative filtering score
   */
  private calculateCollaborativeFilteringScore(userProfile: UserProfile, item: ItemFeatures): number {
    // Simplified collaborative filtering using cosine similarity
    if (userProfile.features.length !== item.features.length) {
      return 0.5 // Default score if feature dimensions don't match
    }

    const dotProduct = userProfile.features.reduce((sum, val, idx) => sum + val * item.features[idx]!, 0)
    const userMagnitude = Math.sqrt(userProfile.features.reduce((sum, val) => sum + val * val, 0))
    const itemMagnitude = Math.sqrt(item.features.reduce((sum, val) => sum + val * val, 0))

    if (userMagnitude === 0 || itemMagnitude === 0) return 0

    return dotProduct / (userMagnitude * itemMagnitude)
  }

  /**
   * Calculate content-based score
   */
  private calculateContentBasedScore(userProfile: UserProfile, item: ItemFeatures): number {
    let score = 0

    // Category match
    const categoryMatch = item.categories.some((cat) => userProfile.preferences.categories.includes(cat))
    if (categoryMatch) score += 0.4

    // Price match
    if (item.price !== undefined) {
      const priceRange = userProfile.preferences.priceRange
      if (item.price >= priceRange.min && item.price <= priceRange.max) {
        score += 0.3
      }
    }

    // Location match
    if (item.location && userProfile.preferences.locations.length > 0) {
      const locationMatch = userProfile.preferences.locations.some((loc) =>
        item.location?.city?.toLowerCase().includes(loc.toLowerCase()),
      )
      if (locationMatch) score += 0.2
    }

    // Quality score
    if (item.rating !== undefined && item.rating > 4) {
      score += 0.1
    }

    return Math.min(score, 1)
  }

  /**
   * Calculate context-aware score
   */
  private calculateContextScore(item: ItemFeatures, request: RecommendationRequest): number {
    let score = 0.5 // Base score

    // Context filters
    if (request.context?.category && item.categories.includes(request.context.category)) {
      score += 0.3
    }

    if (request.context?.budget && item.price !== undefined) {
      const budgetMatch = item.price <= request.context.budget
      score += budgetMatch ? 0.2 : -0.2
    }

    // Popularity boost
    if (item.popularity !== undefined) {
      score += item.popularity * 0.1
    }

    // Recency boost
    if (item.recency !== undefined) {
      score += item.recency * 0.1
    }

    return Math.max(0, Math.min(score, 1))
  }

  /**
   * Calculate AI-enhanced score using language model
   */
  private async calculateAIScore(
    userProfile: UserProfile,
    item: ItemFeatures,
    request: RecommendationRequest,
  ): Promise<number> {
    try {
      const prompt = this.buildAIPrompt(userProfile, item, request)

      const aiResponse = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 100,
        temperature: 0.3,
        metadata: { type: "recommendation_scoring" },
      })

      // Parse AI response to extract score
      const scoreMatch = aiResponse.response.match(/score[:\s]*([0-9.]+)/i)
      if (scoreMatch) {
        const score = Number.parseFloat(scoreMatch[1]!)
        return Math.max(0, Math.min(score, 1))
      }

      return 0.5 // Default score if parsing fails
    } catch (error) {
      // Only log in non-test environments
      if (process.env["NODE_ENV"] !== "test") {
        logger.error("AI scoring failed:", error)
      }
      return 0.5 // Fallback score
    }
  }

  /**
   * Build AI prompt for recommendation scoring
   */
  private buildAIPrompt(userProfile: UserProfile, item: ItemFeatures, request: RecommendationRequest): string {
    return `
Analyze if this item matches the user's preferences and provide a recommendation score from 0 to 1.

User Profile:
- Preferred categories: ${userProfile.preferences.categories.join(", ")}
- Price range: ${userProfile.preferences.priceRange.min}-${userProfile.preferences.priceRange.max} ${userProfile.preferences.priceRange.currency}
- Locations: ${userProfile.preferences.locations.join(", ")}
- User segments: ${userProfile.segments.join(", ")}

Item:
- Type: ${item.type}
- Categories: ${item.categories.join(", ")}
- Price: ${item.price || "N/A"}
- Rating: ${item.rating || "N/A"}
- Location: ${item.location?.city || "N/A"}
- Title: ${item.metadata["title"] || "N/A"}

Context:
- Request type: ${request.type}
- Search context: ${request.context?.searchQuery || "N/A"}

Provide a score from 0 to 1 and brief reasoning. Format: "Score: 0.X - Reason"
    `.trim()
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(userProfile: UserProfile, item: ItemFeatures): number {
    let confidence = 0.5

    // More user data = higher confidence
    if (userProfile.behaviors.length > 10) confidence += 0.2
    if (userProfile.preferences.categories.length > 0) confidence += 0.1

    // More item data = higher confidence
    if (item.rating !== undefined) confidence += 0.1
    if (item.metadata["description"]) confidence += 0.1

    return Math.min(confidence, 1)
  }

  /**
   * Generate reasons for recommendation
   */
  private generateReasons(
    userProfile: UserProfile,
    item: ItemFeatures,
    scores: { cf: number; cb: number; context: number; ai: number },
  ): string[] {
    const reasons: string[] = []

    if (scores.cb > 0.6) {
      const categoryMatch = item.categories.some((cat) => userProfile.preferences.categories.includes(cat))
      if (categoryMatch) {
        reasons.push("Matches your preferred categories")
      }
    }

    if (item.rating && item.rating > 4) {
      reasons.push("Highly rated by other users")
    }

    if (item.popularity && item.popularity > 0.7) {
      reasons.push("Popular among similar users")
    }

    if (scores.cf > 0.7) {
      reasons.push("Similar users also liked this")
    }

    if (reasons.length === 0) {
      reasons.push("Recommended based on your profile")
    }

    return reasons
  }

  /**
   * Apply diversity and filtering to results
   */
  private applyDiversityAndFiltering(
    results: RecommendationResult[],
    request: RecommendationRequest,
  ): RecommendationResult[] {
    let filtered = results

    // Apply filters
    if (request.filters) {
      filtered = filtered.filter((result) => {
        const item = this.itemFeatures.get(result.id)
        if (!item) return false

        // Category filter
        if (request.filters?.categories && request.filters.categories.length > 0) {
          const hasCategory = item.categories.some((cat) => request.filters?.categories?.includes(cat))
          if (!hasCategory) return false
        }

        // Price filter
        if (request.filters?.priceRange && item.price !== undefined) {
          if (item.price < request.filters.priceRange.min || item.price > request.filters.priceRange.max) {
            return false
          }
        }

        // Rating filter
        if (request.filters?.rating && item.rating !== undefined) {
          if (item.rating < request.filters.rating) return false
        }

        // Location filter
        if (request.filters?.location && item.location?.city) {
          if (item.location.city !== request.filters.location) return false
        }

        return true
      })
    }

    // Apply diversity
    const diversityFactor = request.diversityFactor || 0.3
    if (diversityFactor > 0) {
      filtered = this.applyDiversity(filtered, diversityFactor)
    }

    return filtered
  }

  /**
   * Apply diversity to avoid too similar recommendations
   */
  private applyDiversity(results: RecommendationResult[], diversityFactor: number): RecommendationResult[] {
    const diverseResults: RecommendationResult[] = []
    const usedCategories = new Set<string>()

    // Sort by score first
    const sortedResults = results.sort((a, b) => b.score - a.score)

    for (const result of sortedResults) {
      const item = this.itemFeatures.get(result.id)
      if (!item) continue

      // Check category diversity
      const hasNewCategory = item.categories.some((cat) => !usedCategories.has(cat))

      if (hasNewCategory || Math.random() > diversityFactor) {
        diverseResults.push(result)
        item.categories.forEach((cat) => usedCategories.add(cat))
      }
    }

    return diverseResults
  }

  /**
   * Check if user profile is stale and needs updating
   */
  private isProfileStale(profile: UserProfile): boolean {
    const staleThreshold = 24 * 60 * 60 * 1000 // 24 hours
    return Date.now() - profile.lastUpdated.getTime() > staleThreshold
  }

  /**
   * Update user behavior data
   */
  async updateUserBehavior(behavior: UserBehavior): Promise<void> {
    const profile = this.userProfiles.get(behavior.userId)
    if (profile) {
      profile.behaviors.push(behavior)
      profile.lastUpdated = new Date()

      // Rebuild features if significant behavior change
      if (profile.behaviors.length % 10 === 0) {
        profile.features = this.extractUserFeatures(profile.behaviors, profile.preferences)
      }
    }
  }

  /**
   * Get recommendation statistics
   */
  getStats(): Record<string, any> {
    return {
      userProfiles: this.userProfiles.size,
      itemFeatures: this.itemFeatures.size,
      modelVersion: this.modelVersion,
      lastUpdated: new Date(),
    }
  }
}
