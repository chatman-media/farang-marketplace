import { BaseAIProvider } from "../BaseAIProvider"
import { AIProvider } from "../types"

export class DeepSeekProvider extends BaseAIProvider {
  private baseUrl: string

  constructor(config: {
    apiKey: string
    model?: string
    maxTokens?: number
    temperature?: number
    timeout?: number
    baseUrl?: string
  }) {
    super(AIProvider.DEEPSEEK, {
      apiKey: config.apiKey,
      model: config.model || "deepseek-chat",
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    })

    this.baseUrl = config.baseUrl || "https://api.deepseek.com/v1"
  }

  protected async makeRequest(prompt: string, options?: any): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant specialized in Thailand marketplace search and recommendations. You excel at understanding Thai culture, local preferences, and marketplace dynamics. Always provide accurate, helpful responses in valid JSON format when requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: false,
      ...options,
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createAIError(
          `DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
          `DEEPSEEK_${response.status}`,
          response.status >= 500 || response.status === 429,
        )
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw this.createAIError("Invalid response format from DeepSeek", "DEEPSEEK_INVALID_RESPONSE")
      }

      return data.choices[0].message.content
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.createAIError("DeepSeek request timeout", "DEEPSEEK_TIMEOUT", true)
      }

      if (error instanceof Error && error.message.includes("fetch")) {
        throw this.createAIError("Network error connecting to DeepSeek", "DEEPSEEK_NETWORK_ERROR", true)
      }

      throw error
    }
  }

  protected calculateCost(tokensUsed: number): number {
    // DeepSeek pricing (as of 2024)
    // Much more cost-effective than OpenAI
    // Input: $0.14 per 1M tokens, Output: $0.28 per 1M tokens
    const inputCostPer1M = 0.14
    const outputCostPer1M = 0.28
    const avgCostPer1M = (inputCostPer1M + outputCostPer1M) / 2

    return (tokensUsed / 1000000) * avgCostPer1M
  }

  // DeepSeek-specific optimizations
  async enhanceSearchWithReasoning(query: any): Promise<any> {
    const prompt = `Think step by step to enhance this Thailand marketplace search query:

Original Query: "${query.query}"
Current Filters: ${JSON.stringify(query.filters || {})}
User Context: ${JSON.stringify(query.userContext || {})}

Step 1: Analyze the user's intent
Step 2: Identify key entities and concepts
Step 3: Consider Thai market context and local preferences
Step 4: Generate enhanced query and filters
Step 5: Explain the reasoning

Provide your response in JSON format with:
{
  "reasoning": "Step-by-step analysis",
  "enhancedQuery": "improved search terms",
  "searchStrategy": "approach explanation",
  "filters": {},
  "insights": "key insights about user intent"
}`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        enhancedQuery: parsed.enhancedQuery || query.query,
        searchStrategy: parsed.searchStrategy || "Enhanced with reasoning",
        filters: parsed.filters || {},
        insights: parsed.insights || parsed.reasoning || "DeepSeek reasoning applied",
      }
    } catch (error) {
      return this.enhanceSearch(query)
    }
  }

  // Multi-step reasoning for complex queries
  async analyzeComplexQuery(query: string): Promise<{
    breakdown: string[]
    entities: Record<string, any>
    intent: string
    confidence: number
    reasoning: string
  }> {
    const prompt = `Analyze this complex marketplace query step by step:

Query: "${query}"

Please break down the analysis:
1. Decompose the query into components
2. Extract entities (location, price, category, etc.)
3. Determine primary and secondary intents
4. Assess confidence in the analysis
5. Provide reasoning for your conclusions

Return JSON with: breakdown, entities, intent, confidence, reasoning`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        breakdown: parsed.breakdown || [],
        entities: parsed.entities || {},
        intent: parsed.intent || "general_search",
        confidence: parsed.confidence || 70,
        reasoning: parsed.reasoning || "Complex query analysis",
      }
    } catch (error) {
      return {
        breakdown: [query],
        entities: {},
        intent: "general_search",
        confidence: 50,
        reasoning: "Fallback analysis due to error",
      }
    }
  }

  // Code generation for dynamic filters
  async generateFilterCode(requirements: string): Promise<string> {
    const prompt = `Generate JavaScript filter code for marketplace search:

Requirements: ${requirements}

Generate a function that takes an array of items and returns filtered results.
The function should be efficient and handle edge cases.

Return only the JavaScript code, no explanations.`

    try {
      const response = await this.makeRequest(prompt, {
        temperature: 0.3, // Lower temperature for code generation
      })

      return response.trim()
    } catch (error) {
      return "// Filter generation failed\nfunction filter(items) { return items; }"
    }
  }

  // Batch processing with reasoning
  async batchAnalyzeQueries(queries: string[]): Promise<
    Array<{
      query: string
      analysis: any
      reasoning: string
    }>
  > {
    const prompt = `Analyze these marketplace queries with reasoning:

${queries.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

For each query, provide:
- Intent analysis
- Entity extraction
- Enhancement suggestions
- Reasoning for the analysis

Return as JSON array with objects containing: query, analysis, reasoning`

    try {
      const response = await this.makeRequest(prompt)
      const results = JSON.parse(response)

      return Array.isArray(results)
        ? results
        : queries.map((q) => ({
            query: q,
            analysis: { intent: "general_search" },
            reasoning: "Batch analysis failed",
          }))
    } catch (error) {
      return queries.map((q) => ({
        query: q,
        analysis: { intent: "general_search" },
        reasoning: "Error in batch processing",
      }))
    }
  }

  // Mathematical reasoning for pricing
  async analyzePricingStrategy(data: { items: any[]; market: string; competition: any[] }): Promise<{
    strategy: string
    reasoning: string
    recommendations: string[]
    calculations: any
  }> {
    const prompt = `Analyze pricing strategy for Thailand marketplace:

Items: ${JSON.stringify(data.items)}
Market: ${data.market}
Competition: ${JSON.stringify(data.competition)}

Perform mathematical analysis:
1. Calculate market averages
2. Identify pricing patterns
3. Assess competitive positioning
4. Recommend pricing strategy

Show your mathematical reasoning and provide actionable recommendations.`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        strategy: parsed.strategy || "Competitive pricing",
        reasoning: parsed.reasoning || "Mathematical analysis applied",
        recommendations: parsed.recommendations || [],
        calculations: parsed.calculations || {},
      }
    } catch (error) {
      return {
        strategy: "Standard market pricing",
        reasoning: "Analysis failed, using fallback strategy",
        recommendations: ["Monitor competitor prices", "Adjust based on demand"],
        calculations: {},
      }
    }
  }

  // Logical reasoning for service matching
  async logicalServiceMatch(
    requirements: any,
    providers: any[],
  ): Promise<{
    matches: any[]
    logic: string
    confidence: number
  }> {
    const prompt = `Use logical reasoning to match services:

Requirements: ${JSON.stringify(requirements)}
Available Providers: ${JSON.stringify(providers)}

Apply logical rules:
1. Must-have requirements (hard constraints)
2. Nice-to-have preferences (soft constraints)
3. Scoring based on match quality
4. Logical deduction for best matches

Explain your logical reasoning process.`

    try {
      const response = await this.makeRequest(prompt)
      const parsed = JSON.parse(response)

      return {
        matches: parsed.matches || [],
        logic: parsed.logic || "Logical matching applied",
        confidence: parsed.confidence || 80,
      }
    } catch (error) {
      return {
        matches: [],
        logic: "Logical matching failed",
        confidence: 0,
      }
    }
  }

  // Health check with reasoning
  async healthCheckWithReasoning(): Promise<{
    healthy: boolean
    reasoning: string
    performance: any
  }> {
    try {
      const startTime = Date.now()
      const response = await this.makeRequest("Perform a health check and explain your reasoning", {
        max_tokens: 100,
      })
      const responseTime = Date.now() - startTime

      return {
        healthy: response.length > 0,
        reasoning: "DeepSeek responded successfully with reasoning capability",
        performance: {
          responseTime,
          tokensGenerated: this.estimateTokens(response),
        },
      }
    } catch (error) {
      return {
        healthy: false,
        reasoning: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        performance: { responseTime: 0, tokensGenerated: 0 },
      }
    }
  }

  // Token estimation for DeepSeek
  estimateTokens(text: string): number {
    // DeepSeek uses similar tokenization to other models
    // Rough estimation for mixed English/Thai content
    return Math.ceil(text.length / 3.5)
  }
}
