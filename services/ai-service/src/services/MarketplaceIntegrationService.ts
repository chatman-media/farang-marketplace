import type { UserBehavior } from "../models/index"
import { AIProviderService } from "./AIProviderService"
import { ContentAnalysisService } from "./ContentAnalysisService"
import { RecommendationEngine } from "./RecommendationEngine"
import { UserBehaviorService } from "./UserBehaviorService"

export interface BookingIntelligence {
  bookingId: string
  userId: string
  listingId: string
  intelligenceType: "matching" | "pricing" | "fraud_detection" | "optimization"
  recommendations: {
    action: string
    confidence: number
    reasoning: string
    data: Record<string, any>
  }[]
  riskScore?: number
  priceOptimization?: {
    suggestedPrice: number
    priceRange: { min: number; max: number }
    factors: string[]
    confidence: number
  }
  fraudIndicators?: {
    score: number
    flags: string[]
    severity: "low" | "medium" | "high"
    recommendations: string[]
  }
  createdAt: Date
}

export interface PricingSuggestion {
  listingId: string
  currentPrice?: number
  suggestedPrice: number
  priceRange: { min: number; max: number }
  confidence: number
  factors: {
    factor: string
    impact: number
    description: string
  }[]
  marketData: {
    averagePrice: number
    competitorPrices: number[]
    demandLevel: "low" | "medium" | "high"
    seasonality: number
  }
  reasoning: string
  validUntil: Date
  createdAt: Date
}

export interface SmartNotification {
  userId: string
  type: "booking_reminder" | "price_alert" | "recommendation" | "engagement"
  priority: "low" | "medium" | "high" | "urgent"
  channel: "email" | "push" | "sms" | "in_app" | "telegram" | "whatsapp" | "line"
  timing: {
    sendAt: Date
    timezone: string
    optimalWindow: { start: string; end: string }
  }
  content: {
    title: string
    message: string
    actionUrl?: string
    personalization: Record<string, any>
  }
  aiReasoning: string
  expectedEngagement: number
  createdAt: Date
}

export interface FraudDetectionResult {
  userId: string
  bookingId?: string
  listingId?: string
  riskScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  flags: {
    type: string
    severity: number
    description: string
    evidence: Record<string, any>
  }[]
  recommendations: {
    action: "allow" | "review" | "block" | "verify"
    reasoning: string
    confidence: number
  }
  verificationSteps?: string[]
  createdAt: Date
}

export class MarketplaceIntegrationService {
  private aiProvider: AIProviderService
  private recommendationEngine: RecommendationEngine
  private userBehaviorService: UserBehaviorService
  private contentAnalysisService: ContentAnalysisService

  // Cache for frequently accessed data
  private priceCache: Map<string, PricingSuggestion> = new Map()
  private fraudCache: Map<string, FraudDetectionResult> = new Map()
  private notificationQueue: SmartNotification[] = []

  constructor(
    aiProvider: AIProviderService,
    recommendationEngine: RecommendationEngine,
    userBehaviorService: UserBehaviorService,
    contentAnalysisService: ContentAnalysisService,
  ) {
    this.aiProvider = aiProvider
    this.recommendationEngine = recommendationEngine
    this.userBehaviorService = userBehaviorService
    this.contentAnalysisService = contentAnalysisService
  }

  /**
   * Generate intelligent booking recommendations
   */
  async generateBookingIntelligence(
    userId: string,
    listingId: string,
    bookingData: Record<string, any>,
  ): Promise<BookingIntelligence> {
    try {
      // Get user behavior and preferences
      const userInsights = await this.userBehaviorService.getUserInsights(userId)
      const userBehaviors = await this.userBehaviorService.getUserBehaviors(userId, { limit: 50 })

      // Generate recommendations using AI
      const recommendations = await this.generateAIRecommendations(
        userId,
        listingId,
        bookingData,
        userInsights,
        userBehaviors,
      )

      // Check for fraud indicators
      const fraudResult = await this.detectFraud(userId, listingId, bookingData)

      // Generate price optimization
      const priceOptimization = await this.generatePriceOptimization(listingId, bookingData)

      const intelligence: BookingIntelligence = {
        bookingId: bookingData["bookingId"] || `temp_${Date.now()}`,
        userId,
        listingId,
        intelligenceType: "matching",
        recommendations,
        riskScore: fraudResult.riskScore,
        priceOptimization: priceOptimization || {
          suggestedPrice: 1000,
          priceRange: { min: 800, max: 1200 },
          factors: ["fallback"],
          confidence: 0.5,
        },
        fraudIndicators: {
          score: fraudResult.riskScore,
          flags: fraudResult.flags.map((f) => f.type),
          severity: fraudResult.riskLevel === "critical" ? "high" : fraudResult.riskLevel,
          recommendations: [fraudResult.recommendations.action],
        },
        createdAt: new Date(),
      }

      return intelligence
    } catch (error) {
      console.error("Error generating booking intelligence:", error)
      throw new Error("Failed to generate booking intelligence")
    }
  }

  /**
   * Generate automated price suggestions based on market data
   */
  async generatePriceSuggestions(
    listingId: string,
    currentPrice?: number,
    marketContext?: Record<string, any>,
  ): Promise<PricingSuggestion> {
    try {
      // Check cache first
      const cacheKey = `${listingId}_${currentPrice || "no_price"}`
      const cached = this.priceCache.get(cacheKey)
      if (cached && cached.validUntil > new Date()) {
        return cached
      }

      // Analyze market data
      const marketData = await this.analyzeMarketData(listingId, marketContext)

      // Generate AI-powered pricing suggestions
      const aiSuggestion = await this.generateAIPricingSuggestion(listingId, currentPrice, marketData, marketContext)

      const suggestion: PricingSuggestion = {
        listingId,
        currentPrice: currentPrice || 0,
        suggestedPrice: aiSuggestion.price,
        priceRange: aiSuggestion.range,
        confidence: aiSuggestion.confidence,
        factors: aiSuggestion.factors,
        marketData,
        reasoning: aiSuggestion.reasoning,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      }

      // Cache the result
      this.priceCache.set(cacheKey, suggestion)

      return suggestion
    } catch (error) {
      console.error("Error generating price suggestions:", error)
      throw new Error("Failed to generate price suggestions")
    }
  }

  /**
   * Create smart notifications with optimal timing
   */
  async createSmartNotification(
    userId: string,
    type: SmartNotification["type"],
    context: Record<string, any>,
  ): Promise<SmartNotification> {
    try {
      // Analyze user behavior for optimal timing
      const userBehaviors = await this.userBehaviorService.getUserBehaviors(userId, { limit: 100 })
      const optimalTiming = await this.calculateOptimalTiming(userId, type, userBehaviors)

      // Generate personalized content
      const personalizedContent = this.getFallbackNotificationContent(type, context)

      const notification: SmartNotification = {
        userId,
        type,
        priority: this.calculateNotificationPriority(type, context),
        channel: await this.selectOptimalChannel(userId, type),
        timing: optimalTiming,
        content: personalizedContent,
        aiReasoning: "Generated based on user behavior analysis and engagement optimization",
        expectedEngagement: await this.predictEngagement(userId, type, personalizedContent),
        createdAt: new Date(),
      }

      // Add to notification queue
      this.notificationQueue.push(notification)

      return notification
    } catch (error) {
      console.error("Error creating smart notification:", error)
      throw new Error("Failed to create smart notification")
    }
  }

  /**
   * Detect fraud and assess risk
   */
  async detectFraud(
    userId: string,
    listingId?: string,
    transactionData?: Record<string, any>,
  ): Promise<FraudDetectionResult> {
    try {
      // Check cache first
      const cacheKey = `${userId}_${listingId || "no_listing"}`
      const cached = this.fraudCache.get(cacheKey)
      if (cached && Date.now() - cached.createdAt.getTime() < 5 * 60 * 1000) {
        // 5 minutes
        return cached
      }

      // Analyze user behavior patterns
      const userBehaviors = await this.userBehaviorService.getUserBehaviors(userId, { limit: 200 })
      const behaviorFlags = await this.analyzeBehaviorForFraud(userBehaviors)

      // Analyze transaction patterns
      const transactionFlags = await this.analyzeTransactionForFraud(transactionData)

      // AI-powered fraud detection
      const aiAnalysis = await this.performAIFraudAnalysis(userId, listingId, transactionData, userBehaviors)

      // Combine all flags
      const allFlags = [...behaviorFlags, ...transactionFlags, ...aiAnalysis.flags]
      const riskScore = this.calculateRiskScore(allFlags)
      const riskLevel = this.determineRiskLevel(riskScore)

      const result: FraudDetectionResult = {
        userId,
        bookingId: transactionData?.["bookingId"],
        listingId: listingId || "unknown",
        riskScore,
        riskLevel,
        flags: allFlags,
        recommendations: {
          action: this.determineRecommendedAction(riskLevel, allFlags),
          reasoning: aiAnalysis.reasoning,
          confidence: aiAnalysis.confidence,
        },
        verificationSteps: this.generateVerificationSteps(riskLevel, allFlags),
        createdAt: new Date(),
      }

      // Cache the result
      this.fraudCache.set(cacheKey, result)

      return result
    } catch (error) {
      console.error("Error detecting fraud:", error)
      throw new Error("Failed to detect fraud")
    }
  }

  /**
   * Generate AI-powered booking recommendations
   */
  private async generateAIRecommendations(
    userId: string,
    listingId: string,
    bookingData: Record<string, any>,
    userInsights: any[],
    userBehaviors: UserBehavior[],
  ): Promise<BookingIntelligence["recommendations"]> {
    try {
      const prompt = `Analyze booking data and generate intelligent recommendations:

User ID: ${userId}
Listing ID: ${listingId}
Booking Data: ${JSON.stringify(bookingData)}
User Insights: ${JSON.stringify(userInsights.slice(0, 5))}
Recent Behaviors: ${userBehaviors
        .slice(0, 10)
        .map((b) => `${b.action} on ${b.entityType}`)
        .join(", ")}

Generate recommendations for:
1. Booking optimization (timing, duration, add-ons)
2. User experience improvements
3. Cross-selling opportunities
4. Risk mitigation

Provide JSON response with recommendations array containing action, confidence, reasoning, and data fields.`

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-3.5-turbo",
        prompt,
        maxTokens: 1000,
        temperature: 0.7,
        metadata: {},
      })

      // Parse AI response
      const aiRecommendations = this.parseAIRecommendations(response.response)

      return aiRecommendations
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
      return [
        {
          action: "review_booking",
          confidence: 0.5,
          reasoning: "Fallback recommendation due to AI error",
          data: { fallback: true },
        },
      ]
    }
  }

  /**
   * Generate price optimization suggestions
   */
  private async generatePriceOptimization(
    listingId: string,
    bookingData: Record<string, any>,
  ): Promise<BookingIntelligence["priceOptimization"]> {
    try {
      const pricingSuggestion = await this.generatePriceSuggestions(listingId, bookingData["currentPrice"], bookingData)

      return {
        suggestedPrice: pricingSuggestion.suggestedPrice,
        priceRange: pricingSuggestion.priceRange,
        factors: pricingSuggestion.factors.map((f) => f.factor),
        confidence: pricingSuggestion.confidence,
      }
    } catch (error) {
      console.error("Error generating price optimization:", error)
      return undefined
    }
  }

  /**
   * Analyze market data for pricing
   */
  private async analyzeMarketData(
    listingId: string,
    context?: Record<string, any>,
  ): Promise<PricingSuggestion["marketData"]> {
    try {
      // Mock market data analysis - in real implementation, this would fetch from external APIs
      const basePrice = context?.["currentPrice"] || 1000
      const seasonalityFactor = this.calculateSeasonality(new Date())

      return {
        averagePrice: basePrice * 1.1,
        competitorPrices: [basePrice * 0.9, basePrice * 1.05, basePrice * 1.15, basePrice * 0.95, basePrice * 1.2],
        demandLevel: this.calculateDemandLevel(context),
        seasonality: seasonalityFactor,
      }
    } catch (error) {
      console.error("Error analyzing market data:", error)
      return {
        averagePrice: 1000,
        competitorPrices: [900, 1050, 1150, 950, 1200],
        demandLevel: "medium",
        seasonality: 1,
      }
    }
  }

  /**
   * Generate AI-powered pricing suggestions
   */
  private async generateAIPricingSuggestion(
    listingId: string,
    currentPrice: number | undefined,
    marketData: PricingSuggestion["marketData"],
    context?: Record<string, any>,
  ): Promise<{
    price: number
    range: { min: number; max: number }
    confidence: number
    factors: PricingSuggestion["factors"]
    reasoning: string
  }> {
    try {
      const prompt = `Analyze pricing data and suggest optimal price:

Listing ID: ${listingId}
Current Price: ${currentPrice || "Not set"}
Market Average: ${marketData.averagePrice}
Competitor Prices: ${marketData.competitorPrices.join(", ")}
Demand Level: ${marketData.demandLevel}
Seasonality Factor: ${marketData.seasonality}
Context: ${JSON.stringify(context || {})}

Consider:
- Market positioning
- Demand patterns
- Seasonal factors
- Competitive landscape
- Revenue optimization

Provide JSON response with: suggestedPrice, priceRange (min/max), confidence (0-1), factors array, and reasoning.`

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-3.5-turbo",
        prompt,
        maxTokens: 800,
        temperature: 0.3,
        metadata: {},
      })

      const aiSuggestion = this.parseAIPricingSuggestion(response.response, currentPrice, marketData)

      return aiSuggestion
    } catch (error) {
      console.error("Error generating AI pricing suggestion:", error)
      const fallbackPrice = currentPrice || marketData.averagePrice
      return {
        price: fallbackPrice,
        range: { min: fallbackPrice * 0.8, max: fallbackPrice * 1.2 },
        confidence: 0.5,
        factors: [
          { factor: "market_average", impact: 0.3, description: "Based on market average" },
          { factor: "fallback", impact: 0.7, description: "Fallback pricing due to AI error" },
        ],
        reasoning: "Fallback pricing due to AI processing error",
      }
    }
  }

  /**
   * Perform AI-powered fraud analysis
   */
  private async performAIFraudAnalysis(
    userId: string,
    listingId?: string,
    transactionData?: Record<string, any>,
    userBehaviors?: UserBehavior[],
  ): Promise<{
    flags: FraudDetectionResult["flags"]
    reasoning: string
    confidence: number
  }> {
    try {
      const prompt = `Analyze user data for fraud indicators:

User ID: ${userId}
Listing ID: ${listingId || "N/A"}
Transaction Data: ${JSON.stringify(transactionData || {})}
User Behaviors: ${
        userBehaviors
          ?.slice(0, 10)
          .map((b) => `${b.action} on ${b.entityType}`)
          .join(", ") || "No behaviors"
      }

Analyze for:
1. Suspicious patterns
2. Anomalous behavior
3. Risk indicators
4. Verification needs

Provide JSON response with flags array, reasoning, and confidence (0-1).`

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-3.5-turbo",
        prompt,
        maxTokens: 800,
        temperature: 0.3,
        metadata: {},
      })

      const analysis = this.parseAIFraudAnalysis(response.response)

      return analysis
    } catch (error) {
      console.error("Error performing AI fraud analysis:", error)
      return {
        flags: [],
        reasoning: "AI analysis failed, using fallback detection",
        confidence: 0.3,
      }
    }
  }

  /**
   * Calculate risk score from flags
   */
  private calculateRiskScore(flags: FraudDetectionResult["flags"]): number {
    if (flags.length === 0) return 0

    const totalSeverity = flags.reduce((sum, flag) => sum + flag.severity, 0)
    const averageSeverity = totalSeverity / flags.length
    const flagCountFactor = Math.min(flags.length / 10, 1) // Max factor of 1 for 10+ flags

    return Math.min(averageSeverity * (1 + flagCountFactor), 1)
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(riskScore: number): FraudDetectionResult["riskLevel"] {
    if (riskScore >= 0.8) return "critical"
    if (riskScore >= 0.6) return "high"
    if (riskScore >= 0.3) return "medium"
    return "low"
  }

  /**
   * Determine recommended action based on risk
   */
  private determineRecommendedAction(
    riskLevel: FraudDetectionResult["riskLevel"],
    flags: FraudDetectionResult["flags"],
  ): FraudDetectionResult["recommendations"]["action"] {
    switch (riskLevel) {
      case "critical":
        return "block"
      case "high":
        return flags.some((f) => f.type.includes("payment")) ? "verify" : "review"
      case "medium":
        return "review"
      default:
        return "allow"
    }
  }

  /**
   * Generate verification steps
   */
  private generateVerificationSteps(
    riskLevel: FraudDetectionResult["riskLevel"],
    flags: FraudDetectionResult["flags"],
  ): string[] {
    const steps: string[] = []

    if (riskLevel === "low") return steps

    // Basic verification for all risk levels
    steps.push("Verify user identity with government ID")

    // Additional steps based on flags
    if (flags.some((f) => f.type.includes("payment"))) {
      steps.push("Verify payment method ownership")
    }

    if (flags.some((f) => f.type.includes("location"))) {
      steps.push("Confirm current location via phone verification")
    }

    if (flags.some((f) => f.type.includes("rapid") || f.type.includes("excessive"))) {
      steps.push("Implement temporary rate limiting")
    }

    if (riskLevel === "critical") {
      steps.push("Manual review by security team")
      steps.push("Contact user via verified phone number")
    }

    return steps
  }

  /**
   * Analyze user behavior for fraud detection
   */
  private async analyzeBehaviorForFraud(userBehaviors: UserBehavior[]): Promise<FraudDetectionResult["flags"]> {
    const flags: FraudDetectionResult["flags"] = []

    if (userBehaviors.length === 0) return flags

    // Check for excessive activity
    const recentBehaviors = userBehaviors.filter(
      (b) => Date.now() - b.timestamp.getTime() < 60 * 60 * 1000, // Last hour
    )

    if (recentBehaviors.length > 50) {
      flags.push({
        type: "excessive_activity",
        severity: 0.8,
        description: "Unusually high activity in the last hour",
        evidence: { count: recentBehaviors.length, timeframe: "1 hour" },
      })
    }

    // Check for rapid booking attempts
    const bookingAttempts = userBehaviors.filter((b) => b.action === "book")
    if (bookingAttempts.length > 10) {
      flags.push({
        type: "rapid_booking_attempts",
        severity: 0.9,
        description: "Multiple booking attempts detected",
        evidence: { count: bookingAttempts.length },
      })
    }

    return flags
  }

  /**
   * Analyze transaction for fraud detection
   */
  private async analyzeTransactionForFraud(
    transactionData?: Record<string, any>,
  ): Promise<FraudDetectionResult["flags"]> {
    const flags: FraudDetectionResult["flags"] = []

    if (!transactionData) return flags

    // Check for high-value transactions
    if (transactionData["amount"] && transactionData["amount"] > 50000) {
      flags.push({
        type: "high_value_transaction",
        severity: 0.7,
        description: "High-value transaction detected",
        evidence: { amount: transactionData["amount"], currency: transactionData["currency"] },
      })
    }

    return flags
  }

  /**
   * Calculate optimal timing for notifications
   */
  private async calculateOptimalTiming(
    userId: string,
    type: SmartNotification["type"],
    userBehaviors: UserBehavior[],
  ): Promise<SmartNotification["timing"]> {
    const activityPattern = this.analyzeUserActivityPattern(userBehaviors)

    let optimalHour: number
    switch (type) {
      case "booking_reminder":
        optimalHour = activityPattern.peakBookingHour
        break
      case "price_alert":
        optimalHour = activityPattern.peakSearchHour
        break
      case "recommendation":
        optimalHour = activityPattern.peakBrowsingHour
        break
      default:
        optimalHour = activityPattern.peakEngagementHour
    }

    const now = new Date()
    const sendAt = new Date()
    sendAt.setHours(optimalHour, 0, 0, 0)

    // If optimal time has passed today, schedule for tomorrow
    if (sendAt <= now) {
      sendAt.setDate(sendAt.getDate() + 1)
    }

    return {
      sendAt,
      optimalWindow: {
        start: `${Math.max(0, optimalHour - 1)}:00`,
        end: `${Math.min(23, optimalHour + 2)}:00`,
      },
      timezone: activityPattern.timezone,
    }
  }

  /**
   * Helper methods for parsing AI responses and calculations
   */
  private parseAIRecommendations(aiResponse: string): BookingIntelligence["recommendations"] {
    try {
      const parsed = JSON.parse(aiResponse)
      return parsed.recommendations || []
    } catch {
      return [
        {
          action: "review_booking",
          confidence: 0.5,
          reasoning: "Failed to parse AI recommendations",
          data: { error: true },
        },
      ]
    }
  }

  private parseAIPricingSuggestion(
    aiResponse: string,
    currentPrice?: number,
    marketData?: PricingSuggestion["marketData"],
  ): {
    price: number
    range: { min: number; max: number }
    confidence: number
    factors: PricingSuggestion["factors"]
    reasoning: string
  } {
    try {
      const parsed = JSON.parse(aiResponse)
      return {
        price: parsed.suggestedPrice || currentPrice || marketData?.averagePrice || 1000,
        range: parsed.priceRange || { min: 800, max: 1200 },
        confidence: parsed.confidence || 0.7,
        factors: parsed.factors || [],
        reasoning: parsed.reasoning || "AI-generated pricing suggestion",
      }
    } catch {
      const fallbackPrice = currentPrice || marketData?.averagePrice || 1000
      return {
        price: fallbackPrice,
        range: { min: fallbackPrice * 0.8, max: fallbackPrice * 1.2 },
        confidence: 0.5,
        factors: [{ factor: "fallback", impact: 1, description: "Fallback pricing" }],
        reasoning: "Failed to parse AI pricing suggestion",
      }
    }
  }

  private parseAIFraudAnalysis(aiResponse: string): {
    flags: FraudDetectionResult["flags"]
    reasoning: string
    confidence: number
  } {
    try {
      const parsed = JSON.parse(aiResponse)
      return {
        flags: parsed.flags || [],
        reasoning: parsed.reasoning || "AI fraud analysis completed",
        confidence: parsed.confidence || 0.7,
      }
    } catch {
      return {
        flags: [],
        reasoning: "Failed to parse AI fraud analysis",
        confidence: 0.3,
      }
    }
  }

  private parseNotificationContent(
    aiResponse: string,
    type: SmartNotification["type"],
    context: Record<string, any>,
  ): SmartNotification["content"] {
    try {
      const parsed = JSON.parse(aiResponse)
      return {
        title: parsed.title || this.getDefaultTitle(type),
        message: parsed.message || this.getDefaultMessage(type, context),
        actionUrl: parsed.actionUrl,
        personalization: parsed.personalization || {},
      }
    } catch {
      return this.getFallbackNotificationContent(type, context)
    }
  }

  private getFallbackNotificationContent(
    type: SmartNotification["type"],
    context: Record<string, any>,
  ): SmartNotification["content"] {
    const titles = {
      booking_reminder: "Don't forget your booking!",
      price_alert: "Price update available",
      recommendation: "New recommendations for you",
      engagement: "Check out what's new",
    }

    const messages = {
      booking_reminder: "Your booking is coming up soon. Make sure you're prepared!",
      price_alert: "Prices have changed for items you're interested in.",
      recommendation: "We found some great options you might like.",
      engagement: "There's something new waiting for you on our platform.",
    }

    return {
      title: titles[type],
      message: messages[type],
      actionUrl: context["actionUrl"],
      personalization: {},
    }
  }

  private getDefaultTitle(type: SmartNotification["type"]): string {
    const titles = {
      booking_reminder: "Booking Reminder",
      price_alert: "Price Alert",
      recommendation: "New Recommendation",
      engagement: "Platform Update",
    }
    return titles[type]
  }

  private getDefaultMessage(type: SmartNotification["type"], context: Record<string, any>): string {
    const messages = {
      booking_reminder: `Your booking ${context["bookingId"] || ""} needs attention.`,
      price_alert: `Price changes detected for ${context["itemName"] || "your items"}.`,
      recommendation: "New recommendations available based on your preferences.",
      engagement: "Check out the latest updates on our platform.",
    }
    return messages[type]
  }

  private analyzeUserActivityPattern(userBehaviors: UserBehavior[]): {
    timezone: string
    peakBookingHour: number
    peakSearchHour: number
    peakBrowsingHour: number
    peakEngagementHour: number
  } {
    // Analyze user activity patterns from behaviors
    const hourCounts = new Array(24).fill(0)
    const bookingHours: number[] = []
    const searchHours: number[] = []
    const browsingHours: number[] = []

    userBehaviors.forEach((behavior) => {
      const hour = behavior.timestamp.getHours()
      hourCounts[hour]++

      switch (behavior.action) {
        case "book":
        case "purchase":
          bookingHours.push(hour)
          break
        case "search":
          searchHours.push(hour)
          break
        case "view":
          browsingHours.push(hour)
          break
      }
    })

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))

    return {
      timezone: "Asia/Bangkok", // Default timezone
      peakBookingHour: this.getMostFrequentHour(bookingHours) || 14,
      peakSearchHour: this.getMostFrequentHour(searchHours) || 9,
      peakBrowsingHour: this.getMostFrequentHour(browsingHours) || 19,
      peakEngagementHour: peakHour || 11,
    }
  }

  private getMostFrequentHour(hours: number[]): number | null {
    if (hours.length === 0) return null

    const hourCounts = new Array(24).fill(0)
    hours.forEach((hour) => hourCounts[hour]++)

    return hourCounts.indexOf(Math.max(...hourCounts))
  }

  private extractUserPreferences(userBehaviors: UserBehavior[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    // Extract preferences from user behaviors
    const categories = userBehaviors.map((b) => b.metadata?.["category"]).filter(Boolean)

    const locations = userBehaviors.map((b) => b.metadata?.["location"]).filter(Boolean)

    const priceRanges = userBehaviors.map((b) => b.metadata?.["priceRange"]).filter(Boolean)

    if (categories.length > 0) {
      preferences["preferredCategories"] = [...new Set(categories)]
    }

    if (locations.length > 0) {
      preferences["preferredLocations"] = [...new Set(locations.map((l: any) => l.city))]
    }

    if (priceRanges.length > 0) {
      const avgMin = priceRanges.reduce((sum: number, range: any) => sum + (range.min || 0), 0) / priceRanges.length
      const avgMax = priceRanges.reduce((sum: number, range: any) => sum + (range.max || 0), 0) / priceRanges.length
      preferences["priceRange"] = { min: avgMin, max: avgMax }
    }

    return preferences
  }

  private calculateNotificationPriority(
    type: SmartNotification["type"],
    context: Record<string, any>,
  ): SmartNotification["priority"] {
    switch (type) {
      case "booking_reminder":
        return context["urgency"] === "high" ? "urgent" : "high"
      case "price_alert":
        return context["priceChange"] > 0.2 ? "high" : "medium"
      case "recommendation":
        return "medium"
      case "engagement":
        return "low"
      default:
        return "medium"
    }
  }

  private async selectOptimalChannel(
    userId: string,
    type: SmartNotification["type"],
  ): Promise<SmartNotification["channel"]> {
    // In a real implementation, this would analyze user preferences and engagement rates
    // For Thailand market, prioritize popular local channels
    const channelPreferences = {
      booking_reminder: "line", // LINE is most popular in Thailand
      price_alert: "telegram", // Telegram for quick alerts
      recommendation: "whatsapp", // WhatsApp for personalized recommendations
      engagement: "push", // Push for general engagement
    } as const

    return channelPreferences[type] || "in_app"
  }

  private async predictEngagement(
    userId: string,
    type: SmartNotification["type"],
    content: SmartNotification["content"],
  ): Promise<number> {
    // Mock engagement prediction - in real implementation, this would use ML models
    const baseEngagement = {
      booking_reminder: 0.8,
      price_alert: 0.6,
      recommendation: 0.4,
      engagement: 0.3,
    }

    return baseEngagement[type] || 0.5
  }

  private calculateSeasonality(date: Date): number {
    const month = date.getMonth()
    // Thailand high season: November to March
    if (month >= 10 || month <= 2) {
      return 1.3 // 30% increase during high season
    }
    // Low season: April to October
    return 0.9 // 10% decrease during low season
  }

  private calculateDemandLevel(context?: Record<string, any>): PricingSuggestion["marketData"]["demandLevel"] {
    // Mock demand calculation - in real implementation, this would analyze booking patterns
    const currentHour = new Date().getHours()

    if (currentHour >= 9 && currentHour <= 17) {
      return "high" // Business hours
    }
    if (currentHour >= 18 && currentHour <= 22) {
      return "medium" // Evening
    }
    return "low" // Night/early morning
  }
}
