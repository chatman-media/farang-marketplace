import type {
  AIProvider,
  AIProviderInterface,
  SearchQuery,
  SearchResult,
  RecommendationRequest,
  RecommendationResponse,
  ServiceMatchingRequest,
  ServiceMatchingResponse,
  AIMetrics,
  AIError,
  PromptTemplate,
} from './types.js';

export abstract class BaseAIProvider implements AIProviderInterface {
  protected provider: AIProvider;
  protected apiKey: string;
  protected model: string;
  protected maxTokens: number;
  protected temperature: number;
  protected timeout: number;
  protected metrics: AIMetrics;

  constructor(
    provider: AIProvider,
    config: {
      apiKey: string;
      model: string;
      maxTokens?: number;
      temperature?: number;
      timeout?: number;
    }
  ) {
    this.provider = provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 30000;

    this.metrics = {
      provider,
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      tokensUsed: 0,
      cost: 0,
      lastUsed: new Date(),
    };
  }

  // Abstract methods to be implemented by specific providers
  protected abstract makeRequest(
    prompt: string,
    options?: any
  ): Promise<string>;
  protected abstract calculateCost(tokensUsed: number): number;

  // Common functionality
  protected updateMetrics(
    responseTime: number,
    tokensUsed: number,
    isError: boolean = false
  ) {
    this.metrics.requestCount++;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.requestCount - 1) +
        responseTime) /
      this.metrics.requestCount;

    if (isError) {
      this.metrics.errorRate =
        (this.metrics.errorRate * (this.metrics.requestCount - 1) + 1) /
        this.metrics.requestCount;
    }

    this.metrics.tokensUsed += tokensUsed;
    this.metrics.cost += this.calculateCost(tokensUsed);
    this.metrics.lastUsed = new Date();
  }

  protected createAIError(
    message: string,
    code: string,
    retryable: boolean = false
  ): AIError {
    const error = new Error(message) as AIError;
    error.provider = this.provider;
    error.code = code;
    error.retryable = retryable;
    return error;
  }

  protected formatPrompt(
    template: PromptTemplate,
    variables: Record<string, any>
  ): string {
    let prompt = template.template;

    template.variables.forEach((variable) => {
      const value = variables[variable];
      const placeholder = `{${variable}}`;
      prompt = prompt.replace(
        new RegExp(placeholder, 'g'),
        typeof value === 'object' ? JSON.stringify(value) : String(value || '')
      );
    });

    return prompt;
  }

  protected async executeWithMetrics<T>(
    operation: () => Promise<T>,
    estimatedTokens: number = 100
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, estimatedTokens, false);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, 0, true);
      throw error;
    }
  }

  // Implementation of interface methods
  async enhanceSearch(query: SearchQuery): Promise<{
    enhancedQuery: string;
    searchStrategy: string;
    filters: Record<string, any>;
    insights: string;
  }> {
    const prompt = `Analyze and enhance this search query for a Thailand marketplace:

Original Query: "${query.query}"
Current Filters: ${JSON.stringify(query.filters || {})}
User Context: ${JSON.stringify(query.userContext || {})}

Please provide a JSON response with:
1. enhancedQuery: Improved search terms with better keywords
2. searchStrategy: Explanation of search approach
3. filters: Suggested additional filters to apply
4. insights: Analysis of user intent and recommendations

Consider Thai context, local preferences, and marketplace specifics.`;

    return this.executeWithMetrics(async () => {
      const response = await this.makeRequest(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          enhancedQuery: parsed.enhancedQuery || query.query,
          searchStrategy: parsed.searchStrategy || 'Standard keyword search',
          filters: parsed.filters || {},
          insights: parsed.insights || 'No specific insights available',
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          enhancedQuery: query.query,
          searchStrategy: 'Fallback: Standard search due to parsing error',
          filters: {},
          insights: 'Unable to generate AI insights',
        };
      }
    }, 500);
  }

  async rankResults(
    results: SearchResult[],
    query: SearchQuery
  ): Promise<SearchResult[]> {
    if (results.length === 0) return results;

    const prompt = `Rank these search results for relevance to the query:

Query: "${query.query}"
User Context: ${JSON.stringify(query.userContext || {})}
Filters: ${JSON.stringify(query.filters || {})}

Results to rank:
${results.map((r, i) => `${i + 1}. ${r.title} - ${r.description} (Price: ${r.price} ${r.currency}, Location: ${r.location})`).join('\n')}

Please provide a JSON array with the results reordered by relevance, including:
- Original index (0-based)
- New relevance score (0-100)
- Brief reason for ranking

Format: [{"index": 0, "score": 95, "reason": "Perfect match for query"}, ...]`;

    return this.executeWithMetrics(async () => {
      const response = await this.makeRequest(prompt);

      try {
        const rankings = JSON.parse(response);

        // Apply rankings to results
        const rankedResults = rankings
          .sort((a: any, b: any) => b.score - a.score)
          .map((ranking: any) => {
            const result = results[ranking.index];
            if (result) {
              result.relevanceScore = ranking.score;
              result.aiReason = ranking.reason;
            }
            return result;
          })
          .filter(Boolean);

        return rankedResults;
      } catch (parseError) {
        // Fallback: return original results with default scores
        return results.map((result) => ({
          ...result,
          relevanceScore: 50,
          aiReason: 'Default ranking due to AI parsing error',
        }));
      }
    }, 800);
  }

  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const prompt = `Generate personalized recommendations for a Thailand marketplace user:

User ID: ${request.userId}
Recommendation Type: ${request.type}
Context: ${JSON.stringify(request.context || {})}
Limit: ${request.limit || 10}

Based on the user's context and the type of recommendations requested, suggest relevant items.
Consider Thai market preferences, seasonal factors, and user behavior patterns.

Provide a JSON response with:
- recommendations: Array of recommended items with scores
- reason: Overall explanation for recommendations
- confidence: Confidence level (0-100)
- explanation: Detailed AI reasoning`;

    return this.executeWithMetrics(async () => {
      const response = await this.makeRequest(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          recommendations: parsed.recommendations || [],
          type: request.type,
          reason: parsed.reason || 'AI-generated recommendations',
          confidence: parsed.confidence || 70,
          aiExplanation:
            parsed.explanation || 'Recommendations based on user context',
        };
      } catch (parseError) {
        return {
          recommendations: [],
          type: request.type,
          reason: 'Unable to generate recommendations due to parsing error',
          confidence: 0,
          aiExplanation: 'AI service temporarily unavailable',
        };
      }
    }, 600);
  }

  async matchServices(
    request: ServiceMatchingRequest
  ): Promise<ServiceMatchingResponse> {
    const prompt = `Match service providers to user requirements in Thailand:

Requirements: ${JSON.stringify(request.requirements)}
User Profile: ${JSON.stringify(request.userProfile || {})}

Find the best matching service providers considering:
- Service type compatibility
- Location and distance
- Budget alignment
- Availability
- Quality ratings
- Special requirements

Provide JSON response with:
- matches: Array of provider matches with scores and reasons
- searchStrategy: Explanation of matching approach
- alternatives: Suggested alternative options`;

    return this.executeWithMetrics(async () => {
      const response = await this.makeRequest(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          matches: parsed.matches || [],
          searchStrategy: parsed.searchStrategy || 'Standard service matching',
          alternatives: parsed.alternatives || [],
        };
      } catch (parseError) {
        return {
          matches: [],
          searchStrategy: 'Fallback matching due to parsing error',
          alternatives: [],
        };
      }
    }, 700);
  }

  async analyzeQuery(query: string): Promise<{
    intent: string;
    entities: Record<string, any>;
    suggestions: string[];
    confidence: number;
  }> {
    const prompt = `Analyze this search query for a Thailand marketplace:

Query: "${query}"

Extract and provide JSON response with:
- intent: User's search intent (buy, rent, find_service, compare, etc.)
- entities: Extracted entities (location, price, category, etc.)
- suggestions: 3-5 improved query suggestions
- confidence: Confidence level in analysis (0-100)

Consider Thai language patterns, local terms, and marketplace context.`;

    return this.executeWithMetrics(async () => {
      const response = await this.makeRequest(prompt);

      try {
        const parsed = JSON.parse(response);
        return {
          intent: parsed.intent || 'general_search',
          entities: parsed.entities || {},
          suggestions: parsed.suggestions || [],
          confidence: parsed.confidence || 70,
        };
      } catch (parseError) {
        return {
          intent: 'general_search',
          entities: {},
          suggestions: [],
          confidence: 0,
        };
      }
    }, 300);
  }

  async generateSuggestions(
    partialQuery: string,
    context?: any
  ): Promise<string[]> {
    const prompt = `Generate search suggestions for partial query in Thailand marketplace:

Partial Query: "${partialQuery}"
Context: ${JSON.stringify(context || {})}

Provide 5-8 relevant search suggestions that complete or improve the partial query.
Consider popular searches, Thai market trends, and seasonal factors.

Return as JSON array of strings.`;

    return this.executeWithMetrics(async () => {
      const response = await this.makeRequest(prompt);

      try {
        const suggestions = JSON.parse(response);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch (parseError) {
        return [];
      }
    }, 200);
  }

  // Utility methods
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      provider: this.provider,
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      tokensUsed: 0,
      cost: 0,
      lastUsed: new Date(),
    };
  }
}
