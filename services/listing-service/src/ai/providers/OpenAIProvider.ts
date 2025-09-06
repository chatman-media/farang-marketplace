import { BaseAIProvider } from '../BaseAIProvider.js';
import { AIProvider } from '../types.js';

export class OpenAIProvider extends BaseAIProvider {
  private baseUrl: string;

  constructor(config: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    baseUrl?: string;
  }) {
    super(AIProvider.OPENAI, {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4o-mini',
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    });

    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  protected async makeRequest(prompt: string, options?: any): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant specialized in Thailand marketplace search and recommendations. Provide helpful, accurate, and culturally appropriate responses. Always respond in valid JSON format when requested.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createAIError(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
          `OPENAI_${response.status}`,
          response.status >= 500 || response.status === 429
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw this.createAIError(
          'Invalid response format from OpenAI',
          'OPENAI_INVALID_RESPONSE'
        );
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createAIError(
          'OpenAI request timeout',
          'OPENAI_TIMEOUT',
          true
        );
      }

      if (error instanceof Error && error.message.includes('fetch')) {
        throw this.createAIError(
          'Network error connecting to OpenAI',
          'OPENAI_NETWORK_ERROR',
          true
        );
      }

      throw error;
    }
  }

  protected calculateCost(tokensUsed: number): number {
    // OpenAI GPT-4o-mini pricing (as of 2024)
    // Input: $0.15 per 1M tokens, Output: $0.60 per 1M tokens
    // Simplified calculation assuming 50/50 input/output split
    const inputCostPer1M = 0.15;
    const outputCostPer1M = 0.6;
    const avgCostPer1M = (inputCostPer1M + outputCostPer1M) / 2;

    return (tokensUsed / 1000000) * avgCostPer1M;
  }

  // OpenAI-specific optimizations
  async enhanceSearchWithFunctions(query: any): Promise<any> {
    const functions = [
      {
        name: 'enhance_search_query',
        description:
          'Enhance a marketplace search query with better keywords and filters',
        parameters: {
          type: 'object',
          properties: {
            enhancedQuery: {
              type: 'string',
              description: 'Improved search query with better keywords',
            },
            suggestedFilters: {
              type: 'object',
              description: 'Recommended filters to apply',
            },
            searchStrategy: {
              type: 'string',
              description: 'Explanation of the search approach',
            },
            userIntent: {
              type: 'string',
              description: 'Detected user intent',
            },
          },
          required: ['enhancedQuery', 'searchStrategy', 'userIntent'],
        },
      },
    ];

    const prompt = `Enhance this Thailand marketplace search query:
Query: "${query.query}"
Filters: ${JSON.stringify(query.filters || {})}
User Context: ${JSON.stringify(query.userContext || {})}`;

    try {
      const response = await this.makeRequest(prompt, {
        functions,
        function_call: { name: 'enhance_search_query' },
      });

      return JSON.parse(response);
    } catch (error) {
      // Fallback to regular enhancement
      return this.enhanceSearch(query);
    }
  }

  // Batch processing for multiple queries
  async batchEnhanceQueries(queries: string[]): Promise<string[]> {
    const batchPrompt = `Enhance these Thailand marketplace search queries:

${queries.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Return a JSON array of enhanced queries in the same order.`;

    try {
      const response = await this.makeRequest(batchPrompt);
      const enhanced = JSON.parse(response);
      return Array.isArray(enhanced) ? enhanced : queries;
    } catch (error) {
      console.error('Batch enhancement failed:', error);
      return queries;
    }
  }

  // Streaming responses for real-time suggestions
  async streamSuggestions(
    partialQuery: string
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const prompt = `Generate search suggestions for: "${partialQuery}"
Provide suggestions one by one, each on a new line.`;

    // Note: This is a simplified streaming implementation
    // In a real implementation, you'd use OpenAI's streaming API
    const suggestions = await this.generateSuggestions(partialQuery);

    async function* generator() {
      for (const suggestion of suggestions) {
        yield suggestion;
        // Simulate streaming delay
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return generator();
  }

  // Advanced ranking with embeddings
  async rankWithEmbeddings(results: any[], query: any): Promise<any[]> {
    // This would use OpenAI's embeddings API for semantic similarity
    // For now, fall back to regular ranking
    return this.rankResults(results, query);
  }

  // Content moderation
  async moderateContent(content: string): Promise<{
    flagged: boolean;
    categories: string[];
    confidence: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/moderations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Moderation API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.results[0];

      return {
        flagged: result.flagged,
        categories: Object.keys(result.categories).filter(
          (key) => result.categories[key]
        ),
        confidence:
          Math.max(
            ...Object.values(result.category_scores as Record<string, number>)
          ) * 100,
      };
    } catch (error) {
      console.error('Content moderation failed:', error);
      return {
        flagged: false,
        categories: [],
        confidence: 0,
      };
    }
  }

  // Custom fine-tuning support
  async useFineTunedModel(modelId: string): Promise<void> {
    this.model = modelId;
  }

  // Token counting estimation
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    // Thai text might have different ratios
    return Math.ceil(text.length / 4);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('Health check', {
        max_tokens: 10,
      });
      return response.length > 0;
    } catch (error) {
      return false;
    }
  }
}
