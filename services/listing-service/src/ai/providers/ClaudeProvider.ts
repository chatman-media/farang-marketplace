import { BaseAIProvider } from "../BaseAIProvider.js"
import { AIProvider } from "../types.js"

export class ClaudeProvider extends BaseAIProvider {
  private baseUrl: string

  constructor(config: {
    apiKey: string
    model?: string
    maxTokens?: number
    temperature?: number
    timeout?: number
    baseUrl?: string
  }) {
    super(AIProvider.CLAUDE, {
      apiKey: config.apiKey,
      model: config.model || "claude-sonnet-4-20250514",
      maxTokens: config.maxTokens || 8000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    })

    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1"
  }

  protected async makeRequest(prompt: string, options?: any): Promise<string> {
    const requestBody = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system:
        "You are Claude, an AI assistant specialized in Thailand marketplace search and recommendations. You are helpful, harmless, and honest. You understand Thai culture and local market dynamics. Always provide responses in valid JSON format when requested.",
      ...options,
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createAIError(
          `Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
          `CLAUDE_${response.status}`,
          response.status >= 500 || response.status === 429
        )
      }

      const data = await response.json()

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw this.createAIError("Invalid response format from Claude", "CLAUDE_INVALID_RESPONSE")
      }

      return data.content[0].text
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.createAIError("Claude request timeout", "CLAUDE_TIMEOUT", true)
      }

      if (error instanceof Error && error.message.includes("fetch")) {
        throw this.createAIError("Network error connecting to Claude", "CLAUDE_NETWORK_ERROR", true)
      }

      throw error
    }
  }

  protected calculateCost(tokensUsed: number): number {
    // Claude pricing (as of 2025)
    // Haiku 3.5: Input $0.80 per 1M tokens, Output $4 per 1M tokens
    // Sonnet 4: Input $3 per 1M tokens, Output $15 per 1M tokens
    // Opus 4: Input $15 per 1M tokens, Output $75 per 1M tokens
    let inputCostPer1M = 0.8
    let outputCostPer1M = 4.0

    if (this.model.includes("sonnet-4")) {
      inputCostPer1M = 3
      outputCostPer1M = 15
    } else if (this.model.includes("opus-4")) {
      inputCostPer1M = 15
      outputCostPer1M = 75
    }

    const avgCostPer1M = (inputCostPer1M + outputCostPer1M) / 2
    return (tokensUsed / 1000000) * avgCostPer1M
  }

  // Claude-specific optimizations
  async enhanceSearchWithThinking(query: any): Promise<any> {
    const prompt = `<thinking>
Let me analyze this Thailand marketplace search query carefully:

Query: "${query.query}"
Filters: ${JSON.stringify(query.filters || {})}
User Context: ${JSON.stringify(query.userContext || {})}

I need to:
1. Understand the user's intent
2. Consider Thai cultural context
3. Identify relevant keywords and synonyms
4. Suggest appropriate filters
5. Provide a clear search strategy

Let me think through each aspect...
</thinking>

Enhance this Thailand marketplace search query:

Original Query: "${query.query}"
Current Filters: ${JSON.stringify(query.filters || {})}
User Context: ${JSON.stringify(query.userContext || {})}

Please provide a JSON response with:
{
  "enhancedQuery": "improved search terms",
  "searchStrategy": "explanation of approach",
  "filters": {},
  "insights": "analysis of user intent and recommendations",
  "culturalContext": "Thai market considerations"
}`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        enhancedQuery: parsed.enhancedQuery || query.query,
        searchStrategy: parsed.searchStrategy || "Claude-enhanced search",
        filters: parsed.filters || {},
        insights: parsed.insights || "Enhanced with Claude thinking",
        culturalContext: parsed.culturalContext,
      }
    } catch (error) {
      return this.enhanceSearch(query)
    }
  }

  // Structured analysis with XML tags
  async structuredAnalysis(query: string): Promise<{
    analysis: any
    confidence: number
    reasoning: string
  }> {
    const prompt = `Analyze this marketplace query using structured thinking:

<query>${query}</query>

<analysis>
Please analyze the query and provide:

<intent>
What is the user trying to accomplish?
</intent>

<entities>
What specific entities can you extract (location, price, category, etc.)?
</entities>

<context>
What Thai cultural or market context is relevant?
</context>

<suggestions>
What improvements or alternatives would you suggest?
</suggestions>

<confidence>
How confident are you in this analysis (0-100)?
</confidence>
</analysis>

Provide your response in JSON format with the analysis results.`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        analysis: parsed.analysis || {},
        confidence: parsed.confidence || 80,
        reasoning: "Structured analysis with Claude",
      }
    } catch (error) {
      return {
        analysis: { intent: "general_search" },
        confidence: 50,
        reasoning: "Structured analysis failed",
      }
    }
  }

  // Multi-turn conversation for complex queries
  async conversationalAnalysis(
    query: string,
    context: string[] = []
  ): Promise<{
    response: string
    followUpQuestions: string[]
    clarifications: string[]
  }> {
    const conversationHistory = context.map((msg, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: msg,
    }))

    const prompt = `Based on our conversation about Thailand marketplace search, analyze this query:

"${query}"

Provide:
1. Your analysis and recommendations
2. Follow-up questions to better understand the user's needs
3. Any clarifications needed

Be conversational and helpful.`

    try {
      const response = await this.makeRequest(prompt, {
        messages: [...conversationHistory, { role: "user", content: prompt }],
      })

      // Extract structured information from conversational response
      const followUpQuestions = this.extractQuestions(response)
      const clarifications = this.extractClarifications(response)

      return {
        response,
        followUpQuestions,
        clarifications,
      }
    } catch (error) {
      return {
        response: "I apologize, but I encountered an error analyzing your query.",
        followUpQuestions: [],
        clarifications: [],
      }
    }
  }

  // Safety and content filtering
  async safetyCheck(content: string): Promise<{
    safe: boolean
    concerns: string[]
    recommendations: string[]
  }> {
    const prompt = `Evaluate this content for safety in a Thailand marketplace context:

Content: "${content}"

Check for:
- Inappropriate or harmful content
- Cultural sensitivity issues
- Legal compliance concerns
- Marketplace policy violations

Provide JSON response with: safe (boolean), concerns (array), recommendations (array)`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        safe: parsed.safe !== false,
        concerns: parsed.concerns || [],
        recommendations: parsed.recommendations || [],
      }
    } catch (error) {
      return {
        safe: true,
        concerns: [],
        recommendations: ["Manual review recommended due to analysis error"],
      }
    }
  }

  // Creative content generation
  async generateCreativeContent(
    type: string,
    context: any
  ): Promise<{
    content: string
    alternatives: string[]
    style: string
  }> {
    const prompt = `Generate creative ${type} content for Thailand marketplace:

Context: ${JSON.stringify(context)}

Create engaging, culturally appropriate content that resonates with Thai users.
Provide the main content plus 2-3 alternatives with different styles.

Return JSON with: content, alternatives, style`

    try {
      const response = await this.makeRequest(prompt, {
        temperature: 0.9, // Higher creativity
      })
      const parsed = JSON.parse(response)

      return {
        content: parsed.content || "",
        alternatives: parsed.alternatives || [],
        style: parsed.style || "standard",
      }
    } catch (error) {
      return {
        content: "Creative content generation failed",
        alternatives: [],
        style: "fallback",
      }
    }
  }

  // Ethical reasoning
  async ethicalAnalysis(scenario: string): Promise<{
    analysis: string
    considerations: string[]
    recommendations: string[]
    ethicalScore: number
  }> {
    const prompt = `Analyze this marketplace scenario from an ethical perspective:

Scenario: ${scenario}

Consider:
- Fairness to all parties
- Cultural sensitivity
- Legal compliance
- User safety and privacy
- Business ethics

Provide ethical analysis and recommendations.`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        analysis: parsed.analysis || "Ethical analysis completed",
        considerations: parsed.considerations || [],
        recommendations: parsed.recommendations || [],
        ethicalScore: parsed.ethicalScore || 80,
      }
    } catch (error) {
      return {
        analysis: "Ethical analysis failed",
        considerations: ["Manual ethical review recommended"],
        recommendations: ["Consult ethics guidelines"],
        ethicalScore: 50,
      }
    }
  }

  // Helper methods
  private extractQuestions(text: string): string[] {
    const questionRegex = /[?]/g
    const sentences = text.split(/[.!?]+/)
    return sentences
      .filter((sentence) => sentence.includes("?"))
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
  }

  private extractClarifications(text: string): string[] {
    const clarificationKeywords = ["clarify", "specify", "explain", "details"]
    const sentences = text.split(/[.!?]+/)
    return sentences
      .filter((sentence) =>
        clarificationKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))
      )
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
  }

  // Health check with detailed diagnostics
  async healthCheckDetailed(): Promise<{
    healthy: boolean
    diagnostics: any
    performance: any
    capabilities: string[]
  }> {
    try {
      const startTime = Date.now()
      const response = await this.makeRequest(
        "Perform a comprehensive health check and list your capabilities",
        {
          max_tokens: 200,
        }
      )
      const responseTime = Date.now() - startTime

      return {
        healthy: response.length > 0,
        diagnostics: {
          apiConnection: "successful",
          responseGeneration: "working",
          model: this.model,
        },
        performance: {
          responseTime,
          tokensGenerated: this.estimateTokens(response),
        },
        capabilities: [
          "Search enhancement",
          "Structured analysis",
          "Conversational AI",
          "Safety checking",
          "Creative content",
          "Ethical reasoning",
        ],
      }
    } catch (error) {
      return {
        healthy: false,
        diagnostics: {
          error: error instanceof Error ? error.message : String(error),
        },
        performance: { responseTime: 0, tokensGenerated: 0 },
        capabilities: [],
      }
    }
  }

  // Token estimation for Claude
  estimateTokens(text: string): number {
    // Claude uses similar tokenization
    // Slightly different for Thai content
    return Math.ceil(text.length / 3.8)
  }
}
