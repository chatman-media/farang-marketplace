import type { UserBehavior, UserPreferences, UserInsight, MarketInsight } from "../models/index.js"
import { AIProviderService } from "./AIProviderService.js"

export class UserBehaviorService {
  private aiProvider: AIProviderService
  private behaviorBuffer: Map<string, UserBehavior[]> = new Map()
  private userInsights: Map<string, UserInsight[]> = new Map()
  private marketInsights: MarketInsight[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider
    this.startBehaviorFlushing()
  }

  /**
   * Track user behavior event
   */
  async trackBehavior(userId: string, behavior: Omit<UserBehavior, "id" | "timestamp" | "userId">): Promise<{ success: boolean; message?: string }> {
    try {
      const fullBehavior: UserBehavior = {
        ...behavior,
        userId,
        id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }

      // Add to buffer
      const userBehaviors = this.behaviorBuffer.get(userId) || []
      userBehaviors.push(fullBehavior)
      this.behaviorBuffer.set(userId, userBehaviors)

      // Trigger real-time analysis for important events
      if (this.isImportantEvent(behavior.action)) {
        await this.analyzeUserBehavior(userId)
      }

      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  /**
   * Check if event requires immediate analysis
   */
  private isImportantEvent(action: UserBehavior["action"]): boolean {
    return ["book", "purchase", "contact"].includes(action)
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(userId: string): Promise<UserInsight[]> {
    try {
      const behaviors = this.behaviorBuffer.get(userId) || []
      if (behaviors.length === 0) return []

      const insights: UserInsight[] = []

      // Analyze behavior patterns
      const patterns = this.extractBehaviorPatterns(behaviors)

      // Generate insights using AI
      const aiInsights = await this.generateAIInsights(userId, behaviors, patterns)
      insights.push(...aiInsights)

      // Generate statistical insights
      const statInsights = this.generateStatisticalInsights(userId, behaviors, patterns)
      insights.push(...statInsights)

      // Store insights
      this.userInsights.set(userId, insights)

      return insights
    } catch (error) {
      console.error("User behavior analysis failed:", error)
      return []
    }
  }

  /**
   * Extract behavior patterns from user actions
   */
  private extractBehaviorPatterns(behaviors: UserBehavior[]): {
    actionFrequency: Record<string, number>
    categoryPreferences: Record<string, number>
    timePatterns: Record<string, number>
    sessionPatterns: {
      averageSessionLength: number
      actionsPerSession: number
      conversionRate: number
    }
    locationPatterns: Record<string, number>
  } {
    const actionFreq: Record<string, number> = {}
    const categoryPref: Record<string, number> = {}
    const timePatterns: Record<string, number> = {}
    const locationPatterns: Record<string, number> = {}
    const sessions = new Map<string, UserBehavior[]>()

    // Group behaviors by session
    for (const behavior of behaviors) {
      const sessionBehaviors = sessions.get(behavior.sessionId) || []
      sessionBehaviors.push(behavior)
      sessions.set(behavior.sessionId, sessionBehaviors)

      // Count actions
      actionFreq[behavior.action] = (actionFreq[behavior.action] || 0) + 1

      // Extract category from metadata
      const category = behavior.metadata["category"]
      if (category) {
        categoryPref[category] = (categoryPref[category] || 0) + 1
      }

      // Time patterns
      const hour = behavior.timestamp.getHours()
      const timeSlot = this.getTimeSlot(hour)
      timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1

      // Location patterns
      if (behavior.location?.city) {
        locationPatterns[behavior.location.city] =
          (locationPatterns[behavior.location.city] || 0) + 1
      }
    }

    // Calculate session metrics
    const sessionLengths: number[] = []
    const sessionActions: number[] = []
    let conversions = 0

    for (const sessionBehaviors of sessions.values()) {
      const sessionStart = Math.min(...sessionBehaviors.map((b) => b.timestamp.getTime()))
      const sessionEnd = Math.max(...sessionBehaviors.map((b) => b.timestamp.getTime()))
      sessionLengths.push((sessionEnd - sessionStart) / (1000 * 60)) // minutes

      sessionActions.push(sessionBehaviors.length)

      // Check for conversion
      if (sessionBehaviors.some((b) => ["book", "purchase", "contact"].includes(b.action))) {
        conversions++
      }
    }

    const sessionPatterns = {
      averageSessionLength: sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length || 0,
      actionsPerSession: sessionActions.reduce((a, b) => a + b, 0) / sessionActions.length || 0,
      conversionRate: conversions / sessions.size || 0,
    }

    return {
      actionFrequency: actionFreq,
      categoryPreferences: categoryPref,
      timePatterns,
      sessionPatterns,
      locationPatterns,
    }
  }

  /**
   * Get time slot for hour
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return "morning"
    if (hour >= 12 && hour < 18) return "afternoon"
    if (hour >= 18 && hour < 22) return "evening"
    return "night"
  }

  /**
   * Generate AI-powered insights
   */
  private async generateAIInsights(
    userId: string,
    behaviors: UserBehavior[],
    patterns: any
  ): Promise<UserInsight[]> {
    try {
      const prompt = this.buildInsightPrompt(userId, behaviors, patterns)

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 500,
        temperature: 0.3,
        metadata: { type: "user_behavior_analysis" },
      })

      return this.parseAIInsights(userId, response.response)
    } catch (error) {
      console.error("AI insight generation failed:", error)
      return []
    }
  }

  /**
   * Build prompt for AI insight generation
   */
  private buildInsightPrompt(userId: string, behaviors: UserBehavior[], patterns: any): string {
    const recentBehaviors = behaviors.slice(-20) // Last 20 behaviors

    return `
Analyze the following user behavior data and generate actionable insights:

User ID: ${userId}
Total Behaviors: ${behaviors.length}
Recent Behaviors: ${recentBehaviors.map((b) => `${b.action} on ${b.entityType}`).join(", ")}

Behavior Patterns:
- Action Frequency: ${JSON.stringify(patterns.actionFrequency)}
- Category Preferences: ${JSON.stringify(patterns.categoryPreferences)}
- Time Patterns: ${JSON.stringify(patterns.timePatterns)}
- Session Metrics: ${JSON.stringify(patterns.sessionPatterns)}
- Location Patterns: ${JSON.stringify(patterns.locationPatterns)}

Generate insights in JSON format:
[{
  "type": "preference|behavior|prediction|segment",
  "insight": "description",
  "confidence": 0.X,
  "evidence": ["evidence1", "evidence2"],
  "actionable": true/false,
  "recommendations": ["rec1", "rec2"]
}]

Focus on actionable insights that can improve user experience or business outcomes.
    `.trim()
  }

  /**
   * Parse AI insights from response
   */
  private parseAIInsights(userId: string, response: string): UserInsight[] {
    try {
      const jsonMatch = response.match(/\[[^\]]+\]/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) return []

      return parsed.map((insight) => ({
        userId,
        type: insight.type || "behavior",
        insight: insight.insight || "",
        confidence: insight.confidence || 0.5,
        evidence: insight.evidence || [],
        actionable: insight.actionable || false,
        recommendations: insight.recommendations || [],
        createdAt: new Date(),
      }))
    } catch (error) {
      console.error("Failed to parse AI insights:", error)
      return []
    }
  }

  /**
   * Generate statistical insights
   */
  private generateStatisticalInsights(
    userId: string,
    behaviors: UserBehavior[],
    patterns: any
  ): UserInsight[] {
    const insights: UserInsight[] = []

    // High engagement insight
    if (patterns.sessionPatterns.actionsPerSession > 10) {
      insights.push({
        userId,
        type: "behavior",
        insight: `User shows high engagement with average of ${Math.round(
          patterns.sessionPatterns.actionsPerSession
        )} actions per session`,
        confidence: 0.9,
        evidence: ["High actions per session", "Consistent activity"],
        actionable: true,
        recommendations: ["Offer premium features", "Send personalized recommendations"],
        createdAt: new Date(),
      })
    }

    // Category preference insight
    const topCategory = Object.entries(patterns.categoryPreferences).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0]

    if (topCategory && (topCategory[1] as number) > behaviors.length * 0.3) {
      insights.push({
        userId,
        type: "preference",
        insight: `Strong preference for ${topCategory[0]} category (${Math.round(((topCategory[1] as number) / behaviors.length) * 100)}% of activity)`,
        confidence: 0.8,
        evidence: [`${topCategory[1]} interactions with ${topCategory[0]}`],
        actionable: true,
        recommendations: [`Show more ${topCategory[0]} items`, "Create category-specific offers"],
        createdAt: new Date(),
      })
    }

    // Time pattern insight
    const topTimeSlot = Object.entries(patterns.timePatterns).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0]

    if (topTimeSlot && (topTimeSlot[1] as number) > behaviors.length * 0.4) {
      insights.push({
        userId,
        type: "behavior",
        insight: `Most active during ${topTimeSlot[0]} (${Math.round(((topTimeSlot[1] as number) / behaviors.length) * 100)}% of activity)`,
        confidence: 0.7,
        evidence: [`${topTimeSlot[1]} actions during ${topTimeSlot[0]}`],
        actionable: true,
        recommendations: [
          `Send notifications during ${topTimeSlot[0]}`,
          "Schedule promotions for peak activity time",
        ],
        createdAt: new Date(),
      })
    }

    // Conversion insight
    if (patterns.sessionPatterns.conversionRate > 0.2) {
      insights.push({
        userId,
        type: "prediction",
        insight: `High conversion potential with ${Math.round(patterns.sessionPatterns.conversionRate * 100)}% conversion rate`,
        confidence: 0.8,
        evidence: ["High conversion rate", "Consistent purchasing behavior"],
        actionable: true,
        recommendations: ["Offer loyalty program", "Provide exclusive deals"],
        createdAt: new Date(),
      })
    }

    return insights
  }

  /**
   * Generate market insights from aggregated user data
   */
  async generateMarketInsights(): Promise<MarketInsight[]> {
    try {
      const allBehaviors: UserBehavior[] = []
      for (const behaviors of this.behaviorBuffer.values()) {
        allBehaviors.push(...behaviors)
      }

      if (allBehaviors.length < 100) return [] // Need sufficient data

      const marketPatterns = this.extractMarketPatterns(allBehaviors)
      const insights = await this.generateAIMarketInsights(marketPatterns)

      this.marketInsights = insights
      return insights
    } catch (error) {
      console.error("Market insight generation failed:", error)
      return []
    }
  }

  /**
   * Extract market-level patterns
   */
  private extractMarketPatterns(behaviors: UserBehavior[]): any {
    const categoryTrends: Record<string, number> = {}
    const locationTrends: Record<string, number> = {}
    const timeTrends: Record<string, number> = {}
    const actionTrends: Record<string, number> = {}

    for (const behavior of behaviors) {
      // Category trends
      const category = behavior.metadata["category"]
      if (category) {
        categoryTrends[category] = (categoryTrends[category] || 0) + 1
      }

      // Location trends
      if (behavior.location?.city) {
        locationTrends[behavior.location.city] = (locationTrends[behavior.location.city] || 0) + 1
      }

      // Time trends
      const hour = behavior.timestamp.getHours()
      const timeSlot = this.getTimeSlot(hour)
      timeTrends[timeSlot] = (timeTrends[timeSlot] || 0) + 1

      // Action trends
      actionTrends[behavior.action] = (actionTrends[behavior.action] || 0) + 1
    }

    return {
      categoryTrends,
      locationTrends,
      timeTrends,
      actionTrends,
      totalBehaviors: behaviors.length,
      uniqueUsers: new Set(behaviors.map((b) => b.userId)).size,
    }
  }

  /**
   * Generate AI-powered market insights
   */
  private async generateAIMarketInsights(patterns: any): Promise<MarketInsight[]> {
    try {
      const prompt = `
Analyze the following marketplace behavior data and identify market trends and opportunities:

Market Data:
- Total Behaviors: ${patterns.totalBehaviors}
- Unique Users: ${patterns.uniqueUsers}
- Category Trends: ${JSON.stringify(patterns.categoryTrends)}
- Location Trends: ${JSON.stringify(patterns.locationTrends)}
- Time Trends: ${JSON.stringify(patterns.timeTrends)}
- Action Trends: ${JSON.stringify(patterns.actionTrends)}

Generate market insights in JSON format:
[{
  "type": "trend|demand|pricing|competition|opportunity",
  "category": "category_name",
  "location": "location_name",
  "insight": "description",
  "impact": "low|medium|high",
  "confidence": 0.X,
  "data": {},
  "recommendations": ["rec1", "rec2"]
}]

Focus on actionable business insights and market opportunities.
      `.trim()

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 600,
        temperature: 0.3,
        metadata: { type: "market_analysis" },
      })

      return this.parseMarketInsights(response.response)
    } catch (error) {
      console.error("AI market insight generation failed:", error)
      return []
    }
  }

  /**
   * Parse market insights from AI response
   */
  private parseMarketInsights(response: string): MarketInsight[] {
    try {
      const jsonMatch = response.match(/\[[^\]]+\]/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) return []

      return parsed.map((insight) => ({
        id: `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: insight.type || "trend",
        category: insight.category,
        location: insight.location,
        insight: insight.insight || "",
        impact: insight.impact || "medium",
        confidence: insight.confidence || 0.5,
        data: insight.data || {},
        recommendations: insight.recommendations || [],
        createdAt: new Date(),
      }))
    } catch (error) {
      console.error("Failed to parse market insights:", error)
      return []
    }
  }

  /**
   * Get user insights
   */
  getUserInsights(userId: string): UserInsight[] {
    return this.userInsights.get(userId) || []
  }

  /**
   * Get market insights
   */
  getMarketInsights(filters?: {
    type?: string
    category?: string
    location?: string
    minConfidence?: number
  }): MarketInsight[] {
    let insights = this.marketInsights

    if (filters) {
      insights = insights.filter((insight) => {
        if (filters.type && insight.type !== filters.type) return false
        if (filters.category && insight.category !== filters.category) return false
        if (filters.location && insight.location !== filters.location) return false
        if (filters.minConfidence && insight.confidence < filters.minConfidence) return false
        return true
      })
    }

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Start periodic behavior flushing
   */
  private startBehaviorFlushing(): void {
    const flushInterval = parseInt(process.env["BEHAVIOR_FLUSH_INTERVAL"] || "300000") // 5 minutes

    this.flushInterval = setInterval(async () => {
      await this.flushBehaviors()
    }, flushInterval)
  }

  /**
   * Flush behaviors to persistent storage
   */
  private async flushBehaviors(): Promise<void> {
    try {
      // In a real implementation, this would save to database
      console.log(`Flushing ${this.behaviorBuffer.size} user behavior buffers`)

      // Generate insights for active users
      for (const userId of this.behaviorBuffer.keys()) {
        await this.analyzeUserBehavior(userId)
      }

      // Generate market insights periodically
      if (Math.random() < 0.1) {
        // 10% chance
        await this.generateMarketInsights()
      }

      // Clear old behaviors (keep last 100 per user)
      for (const [userId, behaviors] of this.behaviorBuffer.entries()) {
        if (behaviors.length > 100) {
          this.behaviorBuffer.set(userId, behaviors.slice(-100))
        }
      }
    } catch (error) {
      console.error("Behavior flushing failed:", error)
    }
  }

  /**
   * Get service statistics
   */
  getStats(): Record<string, any> {
    const totalBehaviors = Array.from(this.behaviorBuffer.values()).reduce(
      (sum, behaviors) => sum + behaviors.length,
      0
    )

    const totalInsights = Array.from(this.userInsights.values()).reduce(
      (sum, insights) => sum + insights.length,
      0
    )

    return {
      service: "UserBehaviorService",
      version: "1.0.0",
      activeUsers: this.behaviorBuffer.size,
      totalBehaviors,
      totalUserInsights: totalInsights,
      totalMarketInsights: this.marketInsights.length,
      lastFlush: new Date(),
    }
  }

  /**
   * Generate user insights from behavior patterns
   */
  async generateUserInsights(userId: string, options: {
    type: "preference" | "behavior" | "engagement"
    timeframe: string
    actionable: boolean
  }): Promise<UserInsight[]> {
    const behaviors = this.behaviorBuffer.get(userId) || []
    if (behaviors.length === 0) return []

    // Mock insights generation based on behavior patterns
    const insights: UserInsight[] = []

    if (options.type === "preference") {
      const categories = behaviors.map(b => b.metadata?.["category"]).filter(Boolean)
      const topCategory = this.getMostFrequent(categories)
      if (topCategory) {
        insights.push({
          userId,
          type: "preference",
          insight: `User shows strong preference for ${topCategory} items`,
          confidence: 0.8,
          evidence: [`Prefers ${topCategory} category`],
          actionable: options.actionable,
          recommendations: [`Show more ${topCategory} items`, `Send ${topCategory} promotions`],
          createdAt: new Date(),
        })
      }
    }

    if (options.type === "behavior") {
      const actions = behaviors.map(b => b.action)
      const topAction = this.getMostFrequent(actions)
      if (topAction) {
        insights.push({
          userId,
          type: "behavior",
          insight: `User's most common action is ${topAction}`,
          confidence: 0.7,
          evidence: [`Frequently ${topAction}s items`],
          actionable: options.actionable,
          recommendations: [`Optimize ${topAction} flow`, `Recommend similar items`],
          createdAt: new Date(),
        })
      }
    }

    if (options.type === "engagement") {
      const avgDuration = behaviors.reduce((sum, b) => sum + (b.metadata?.["duration"] || 0), 0) / behaviors.length
      insights.push({
        userId,
        type: "behavior",
        insight: avgDuration > 30000 ? "High engagement user" : "Low engagement user",
        confidence: 0.6,
        evidence: [`Average session duration: ${Math.round(avgDuration / 1000)}s`],
        actionable: options.actionable,
        recommendations: avgDuration > 30000 ? ["Offer premium features"] : ["Improve UX", "Send engagement campaigns"],
        createdAt: new Date(),
      })
    }

    return insights
  }

  /**
   * Analyze market trends
   */
  async analyzeMarketTrends(options: {
    type: "category" | "location" | "price"
    timeframe: string
    location?: string
    category?: string
  }): Promise<MarketInsight[]> {
    const allBehaviors = Array.from(this.behaviorBuffer.values()).flat()
    const insights: MarketInsight[] = []

    if (options.type === "category") {
      const categories = allBehaviors.map(b => b.metadata?.["category"]).filter(Boolean)
      const categoryCount = this.getFrequencyMap(categories)

      Object.entries(categoryCount).forEach(([category, count]) => {
        const insight: MarketInsight = {
          id: `market_${Date.now()}_${category}`,
          type: "trend",
          category,
          insight: `${category} trending with ${count} interactions in ${options.timeframe}`,
          confidence: Math.min(count / 10, 1),
          impact: count > 10 ? "high" : "medium",
          data: { count, timeframe: options.timeframe },
          recommendations: [`Increase ${category} inventory`, `Promote ${category} items`],
          createdAt: new Date(),
        }
        if (options.location) insight.location = options.location
        insights.push(insight)
      })
    }

    if (options.type === "location") {
      const locations = allBehaviors.map(b => b.metadata?.["location"]).filter(Boolean)
      const locationCount = this.getFrequencyMap(locations)

      Object.entries(locationCount).forEach(([location, count]) => {
        insights.push({
          id: `market_${Date.now()}_${location}`,
          type: "opportunity",
          location,
          insight: `${location} market activity with ${count} interactions in ${options.timeframe}`,
          confidence: Math.min(count / 10, 1),
          impact: count > 8 ? "high" : "medium",
          data: { count, timeframe: options.timeframe },
          recommendations: [`Expand in ${location}`, `Localize for ${location}`],
          createdAt: new Date(),
        })
      })
    }

    if (options.type === "price" && options.category) {
      const categoryBehaviors = allBehaviors.filter(b => b.metadata?.["category"] === options.category)
      const prices = categoryBehaviors.map(b => b.metadata?.["price"]).filter(Boolean) as number[]

      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
        insights.push({
          id: `market_${Date.now()}_price`,
          type: "pricing",
          category: options.category,
          insight: `${options.category} average price: ${avgPrice.toFixed(2)} THB`,
          confidence: 0.7,
          impact: "medium",
          data: { avgPrice, priceCount: prices.length },
          recommendations: ["Adjust pricing strategy", "Monitor competitor prices"],
          createdAt: new Date(),
        })
      }
    }

    return insights
  }

  /**
   * Get user segments
   */
  async getUserSegments(options: {
    algorithm: "behavior" | "preference"
    minSegmentSize: number
  }): Promise<Array<{
    id: string
    name: string
    description: string
    userCount: number
    characteristics: string[]
    recommendations: string[]
  }>> {
    const allBehaviors = Array.from(this.behaviorBuffer.entries())
    const segments: Array<{
      id: string
      name: string
      description: string
      userCount: number
      characteristics: string[]
      recommendations: string[]
    }> = []

    if (options.algorithm === "behavior") {
      // Group users by most common action
      const userActions = new Map<string, string>()
      allBehaviors.forEach(([userId, behaviors]) => {
        const actions = behaviors.map(b => b.action)
        const topAction = this.getMostFrequent(actions)
        if (topAction) userActions.set(userId, topAction)
      })

      const actionGroups = this.groupBy(Array.from(userActions.entries()), ([, action]) => action)

      Object.entries(actionGroups).forEach(([action, users]) => {
        if (users.length >= options.minSegmentSize) {
          segments.push({
            id: `segment_${action}`,
            name: `${action.charAt(0).toUpperCase() + action.slice(1)} Users`,
            description: `Users who primarily ${action} items`,
            userCount: users.length,
            characteristics: [`Primary action: ${action}`, `Active users: ${users.length}`],
            recommendations: [`Optimize ${action} experience`, `Target with ${action}-focused campaigns`],
          })
        }
      })
    }

    if (options.algorithm === "preference") {
      // Group users by preferred category
      const userCategories = new Map<string, string>()
      allBehaviors.forEach(([userId, behaviors]) => {
        const categories = behaviors.map(b => b.metadata?.["category"]).filter(Boolean)
        const topCategory = this.getMostFrequent(categories)
        if (topCategory) userCategories.set(userId, topCategory)
      })

      const categoryGroups = this.groupBy(Array.from(userCategories.entries()), ([, category]) => category)

      Object.entries(categoryGroups).forEach(([category, users]) => {
        if (users.length >= options.minSegmentSize) {
          segments.push({
            id: `segment_${category}`,
            name: `${category.charAt(0).toUpperCase() + category.slice(1)} Enthusiasts`,
            description: `Users interested in ${category} items`,
            userCount: users.length,
            characteristics: [`Preferred category: ${category}`, `Active users: ${users.length}`],
            recommendations: [`Show more ${category} items`, `Send ${category} promotions`],
          })
        }
      })
    }

    return segments
  }

  /**
   * Get behavior trends over time
   */
  async getBehaviorTrends(options: {
    timeframe: string
    granularity: "daily" | "weekly"
    category?: string
    groupBy?: "action" | "category"
  }): Promise<Array<{
    period: string
    value: number
    change: number
    trend: "up" | "down" | "stable"
    breakdown?: Record<string, number>
  }>> {
    const allBehaviors = Array.from(this.behaviorBuffer.values()).flat()
    let filteredBehaviors = allBehaviors

    if (options.category) {
      filteredBehaviors = allBehaviors.filter(b => b.metadata?.["category"] === options.category)
    }

    // Mock trend data
    const trends = []
    const periods = options.granularity === "daily" ? 7 : 4

    for (let i = 0; i < periods; i++) {
      const baseValue = 10 + Math.floor(Math.random() * 20)
      const change = (Math.random() - 0.5) * 10

      let breakdown: Record<string, number> | undefined
      if (options.groupBy === "action") {
        breakdown = {
          view: Math.floor(baseValue * 0.6),
          click: Math.floor(baseValue * 0.3),
          book: Math.floor(baseValue * 0.1),
        }
      } else if (options.groupBy === "category") {
        breakdown = {
          electronics: Math.floor(baseValue * 0.4),
          fashion: Math.floor(baseValue * 0.3),
          home: Math.floor(baseValue * 0.3),
        }
      }

      const trendDirection: "up" | "down" | "stable" = change > 2 ? "up" : change < -2 ? "down" : "stable"
      const trendItem: {
        period: string
        value: number
        change: number
        trend: "up" | "down" | "stable"
        breakdown?: Record<string, number>
      } = {
        period: options.granularity === "daily" ? `Day ${i + 1}` : `Week ${i + 1}`,
        value: baseValue,
        change,
        trend: trendDirection,
      }
      if (breakdown) trendItem.breakdown = breakdown
      trends.push(trendItem)
    }

    return trends
  }

  /**
   * Helper method to get most frequent item
   */
  private getMostFrequent<T>(items: T[]): T | null {
    if (items.length === 0) return null
    const frequency = this.getFrequencyMap(items)
    const entries = Object.entries(frequency)
    if (entries.length === 0) return null
    const mostFrequentEntry = entries.reduce((a, b) => (frequency[a[0]] || 0) > (frequency[b[0]] || 0) ? a : b)
    return mostFrequentEntry[0] as T
  }

  /**
   * Helper method to get frequency map
   */
  private getFrequencyMap<T>(items: T[]): Record<string, number> {
    const frequency: Record<string, number> = {}
    items.forEach(item => {
      const key = String(item)
      frequency[key] = (frequency[key] || 0) + 1
    })
    return frequency
  }

  /**
   * Helper method to group by key
   */
  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {}
    items.forEach(item => {
      const key = keyFn(item)
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return groups
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}
