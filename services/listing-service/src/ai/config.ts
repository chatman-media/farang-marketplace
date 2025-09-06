import { AIProvider, AIProviderConfig } from './types.js';

// Default AI configuration
export const defaultAIConfig: AIProviderConfig = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },

  // DeepSeek Configuration
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
  },

  // Claude Configuration
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '8000'),
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
  },

  // Provider Selection
  defaultProvider:
    (process.env.DEFAULT_AI_PROVIDER as AIProvider) || AIProvider.DEEPSEEK,
  fallbackProviders: [
    AIProvider.DEEPSEEK,
    AIProvider.OPENAI,
    AIProvider.CLAUDE,
  ],

  // Rate Limits
  rateLimits: {
    [AIProvider.OPENAI]: {
      requestsPerMinute: parseInt(process.env.OPENAI_RPM || '60'),
      requestsPerDay: parseInt(process.env.OPENAI_RPD || '1000'),
    },
    [AIProvider.DEEPSEEK]: {
      requestsPerMinute: parseInt(process.env.DEEPSEEK_RPM || '100'),
      requestsPerDay: parseInt(process.env.DEEPSEEK_RPD || '5000'),
    },
    [AIProvider.CLAUDE]: {
      requestsPerMinute: parseInt(process.env.CLAUDE_RPM || '50'),
      requestsPerDay: parseInt(process.env.CLAUDE_RPD || '800'),
    },
  },
};

// Validate configuration
export function validateAIConfig(config: AIProviderConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if at least one provider is configured
  const hasOpenAI = config.openai?.apiKey && config.openai.apiKey.length > 0;
  const hasDeepSeek =
    config.deepseek?.apiKey && config.deepseek.apiKey.length > 0;
  const hasClaude = config.claude?.apiKey && config.claude.apiKey.length > 0;

  if (!hasOpenAI && !hasDeepSeek && !hasClaude) {
    errors.push(
      'At least one AI provider must be configured with a valid API key'
    );
  }

  // Check default provider
  if (!config.defaultProvider) {
    errors.push('Default provider must be specified');
  } else {
    const defaultProviderConfigured =
      (config.defaultProvider === AIProvider.OPENAI && hasOpenAI) ||
      (config.defaultProvider === AIProvider.DEEPSEEK && hasDeepSeek) ||
      (config.defaultProvider === AIProvider.CLAUDE && hasClaude);

    if (!defaultProviderConfigured) {
      errors.push(
        `Default provider ${config.defaultProvider} is not properly configured`
      );
    }
  }

  // Check fallback providers
  if (!config.fallbackProviders || config.fallbackProviders.length === 0) {
    warnings.push(
      'No fallback providers configured - service may fail if default provider is unavailable'
    );
  }

  // Validate rate limits
  Object.entries(config.rateLimits).forEach(([provider, limits]) => {
    if (limits.requestsPerMinute <= 0) {
      warnings.push(
        `Rate limit for ${provider} requests per minute should be positive`
      );
    }
    if (limits.requestsPerDay <= 0) {
      warnings.push(
        `Rate limit for ${provider} requests per day should be positive`
      );
    }
    if (limits.requestsPerDay < limits.requestsPerMinute * 60) {
      warnings.push(
        `Daily rate limit for ${provider} may be too low compared to per-minute limit`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Environment-specific configurations
export const developmentConfig: Partial<AIProviderConfig> = {
  defaultProvider: AIProvider.DEEPSEEK, // Cheapest for development
  fallbackProviders: [AIProvider.DEEPSEEK],
  rateLimits: {
    [AIProvider.OPENAI]: { requestsPerMinute: 10, requestsPerDay: 100 },
    [AIProvider.DEEPSEEK]: { requestsPerMinute: 30, requestsPerDay: 500 },
    [AIProvider.CLAUDE]: { requestsPerMinute: 5, requestsPerDay: 50 },
  },
};

export const productionConfig: Partial<AIProviderConfig> = {
  defaultProvider: AIProvider.DEEPSEEK, // Good balance of cost and performance
  fallbackProviders: [
    AIProvider.DEEPSEEK,
    AIProvider.OPENAI,
    AIProvider.CLAUDE,
  ],
  rateLimits: {
    [AIProvider.OPENAI]: { requestsPerMinute: 60, requestsPerDay: 1000 },
    [AIProvider.DEEPSEEK]: { requestsPerMinute: 100, requestsPerDay: 5000 },
    [AIProvider.CLAUDE]: { requestsPerMinute: 50, requestsPerDay: 800 },
  },
};

export const testConfig: Partial<AIProviderConfig> = {
  defaultProvider: AIProvider.DEEPSEEK,
  fallbackProviders: [],
  rateLimits: {
    [AIProvider.OPENAI]: { requestsPerMinute: 5, requestsPerDay: 20 },
    [AIProvider.DEEPSEEK]: { requestsPerMinute: 10, requestsPerDay: 50 },
    [AIProvider.CLAUDE]: { requestsPerMinute: 3, requestsPerDay: 15 },
  },
};

// Get configuration based on environment
export function getAIConfig(): AIProviderConfig {
  const env = process.env.NODE_ENV || 'development';
  let envConfig: Partial<AIProviderConfig> = {};

  switch (env) {
    case 'production':
      envConfig = productionConfig;
      break;
    case 'test':
      envConfig = testConfig;
      break;
    default:
      envConfig = developmentConfig;
      break;
  }

  return {
    ...defaultAIConfig,
    ...envConfig,
  };
}

// Provider selection strategies
export const providerStrategies = {
  // Cost-optimized: Use cheapest provider first
  costOptimized: {
    defaultProvider: AIProvider.DEEPSEEK,
    fallbackProviders: [
      AIProvider.DEEPSEEK,
      AIProvider.OPENAI,
      AIProvider.CLAUDE,
    ],
  },

  // Performance-optimized: Use fastest/most reliable provider
  performanceOptimized: {
    defaultProvider: AIProvider.OPENAI,
    fallbackProviders: [
      AIProvider.OPENAI,
      AIProvider.CLAUDE,
      AIProvider.DEEPSEEK,
    ],
  },

  // Quality-optimized: Use highest quality provider (Claude 4 Sonnet)
  qualityOptimized: {
    defaultProvider: AIProvider.CLAUDE,
    fallbackProviders: [
      AIProvider.CLAUDE,
      AIProvider.OPENAI,
      AIProvider.DEEPSEEK,
    ],
  },

  // Balanced: Good mix of cost, performance, and quality
  balanced: {
    defaultProvider: AIProvider.DEEPSEEK,
    fallbackProviders: [
      AIProvider.DEEPSEEK,
      AIProvider.OPENAI,
      AIProvider.CLAUDE,
    ],
  },
};

// Dynamic provider selection based on operation type
export function getOptimalProviderForOperation(operation: string): AIProvider {
  switch (operation) {
    case 'search_enhancement':
    case 'query_analysis':
      return AIProvider.DEEPSEEK; // Good reasoning capabilities, cost-effective

    case 'content_generation':
    case 'creative_writing':
      return AIProvider.CLAUDE; // Excellent at creative tasks

    case 'code_generation':
    case 'structured_data':
      return AIProvider.OPENAI; // Good at structured outputs

    case 'recommendations':
    case 'personalization':
      return AIProvider.DEEPSEEK; // Good at complex reasoning

    case 'safety_moderation':
      return AIProvider.OPENAI; // Has dedicated moderation API

    default:
      return AIProvider.DEEPSEEK; // Default to cost-effective option
  }
}

// Cost estimation helpers (updated for 2025 pricing)
export const costEstimates = {
  [AIProvider.OPENAI]: {
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    avgCostPer1M: 0.375,
  },
  [AIProvider.DEEPSEEK]: {
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    avgCostPer1M: 0.21,
  },
  [AIProvider.CLAUDE]: {
    // Claude Sonnet 4 pricing (2025)
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    avgCostPer1M: 9.0,
  },
};

export function estimateOperationCost(
  provider: AIProvider,
  estimatedTokens: number
): number {
  const costs = costEstimates[provider];
  return (estimatedTokens / 1000000) * costs.avgCostPer1M;
}

// Monitoring and alerting thresholds
export const monitoringConfig = {
  costAlerts: {
    dailyThreshold: 10.0, // USD
    monthlyThreshold: 200.0, // USD
  },
  performanceAlerts: {
    responseTimeThreshold: 10000, // ms
    errorRateThreshold: 0.05, // 5%
  },
  rateLimitAlerts: {
    utilizationThreshold: 0.8, // 80% of rate limit
  },
};
