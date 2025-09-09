# AI-Powered Search and Recommendations API

## Overview

The AI-powered search and recommendations system enhances the Thailand
Marketplace with intelligent search capabilities, personalized recommendations,
and smart service matching using multiple AI providers (OpenAI, DeepSeek,
Claude).

## Features

- **Multi-Provider Support**: OpenAI, DeepSeek, and Claude with automatic
  fallback
- **Enhanced Search**: AI-improved query understanding and result ranking
- **Personalized Recommendations**: User-specific suggestions based on behavior
  and preferences
- **Service Matching**: Intelligent matching of service providers to user
  requirements
- **Auto-suggestions**: Real-time search suggestions as users type
- **Cost Optimization**: Automatic provider selection based on cost and
  performance
- **Rate Limiting**: Built-in protection against API abuse
- **Fallback Mechanisms**: Graceful degradation when AI services are unavailable

## Configuration

### Environment Variables

```bash
# AI Provider Selection
DEFAULT_AI_PROVIDER=deepseek

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7
OPENAI_RPM=60
OPENAI_RPD=1000

# DeepSeek Configuration (Recommended)
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_RPM=100
DEEPSEEK_RPD=5000

# Claude Configuration (2025 models)
CLAUDE_API_KEY=your-claude-api-key
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=8000
CLAUDE_TEMPERATURE=0.7
CLAUDE_RPM=50
CLAUDE_RPD=800
```

### Provider Selection Strategy

- **DeepSeek**: Default provider - best cost/performance ratio
- **OpenAI**: Fallback for structured data and code generation
- **Claude Sonnet 4**: Premium provider for highest quality reasoning and
  creative content

## API Endpoints

### 1. Enhanced Search

**POST** `/api/ai/search/enhanced`

Performs AI-enhanced search with query understanding and result ranking.

```json
{
  "query": "scooter rental bangkok",
  "filters": {
    "type": "vehicle",
    "priceRange": { "min": 200, "max": 500 },
    "location": "Bangkok"
  },
  "userContext": {
    "userId": "user-123",
    "location": {
      "latitude": 13.7563,
      "longitude": 100.5018
    },
    "previousSearches": ["motorbike", "rental"]
  },
  "preferredProvider": "deepseek"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "listing-1",
        "type": "vehicle",
        "title": "Honda PCX 150 Scooter",
        "description": "Reliable scooter for city riding",
        "price": 300,
        "currency": "THB",
        "location": "Bangkok",
        "images": ["scooter1.jpg"],
        "rating": 4.5,
        "relevanceScore": 95,
        "aiReason": "Perfect match for scooter rental query"
      }
    ],
    "total": 1,
    "query": "Honda PCX scooter rental Bangkok city",
    "suggestions": ["Honda PCX rental", "scooter hire Bangkok"],
    "aiInsights": {
      "queryUnderstanding": "User looking for scooter rental in Bangkok",
      "searchStrategy": "Location-based vehicle search with price filtering",
      "recommendations": ["Consider nearby areas", "Check availability"]
    },
    "processingTime": 1250
  },
  "metadata": {
    "processingTime": 1250,
    "aiProvider": "deepseek",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Query Analysis

**POST** `/api/ai/analyze/query`

Analyzes search intent and extracts entities from user queries.

```json
{
  "query": "cheap motorbike rental near Khao San Road",
  "preferredProvider": "claude"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "intent": "rental_search",
    "entities": {
      "location": "Khao San Road",
      "type": "motorbike",
      "pricePreference": "cheap",
      "proximity": "near"
    },
    "suggestions": [
      "motorbike rental Khao San Road",
      "budget scooter hire Bangkok",
      "cheap bike rental Banglamphu"
    ],
    "confidence": 92
  }
}
```

### 3. Auto-suggestions

**GET** `/api/ai/suggestions?q=scoo&provider=deepseek`

Provides real-time search suggestions as users type.

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "scoo",
    "suggestions": [
      "scooter rental bangkok",
      "scooter hire phuket",
      "scooter tours chiang mai",
      "scoopy rental thailand"
    ]
  }
}
```

### 4. Personalized Recommendations

**POST** `/api/ai/recommendations`

Generates personalized recommendations based on user profile and behavior.

```json
{
  "userId": "user-123",
  "type": "personalized",
  "context": {
    "currentItem": "listing-456",
    "userHistory": ["scooter", "bangkok", "rental"],
    "location": {
      "latitude": 13.7563,
      "longitude": 100.5018
    },
    "preferences": {
      "priceRange": "budget",
      "vehicleType": "scooter"
    }
  },
  "limit": 10
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "listing-789",
        "type": "vehicle",
        "title": "Yamaha NMAX Scooter",
        "price": 350,
        "relevanceScore": 88,
        "aiReason": "Similar to previous rentals, good price match"
      }
    ],
    "type": "personalized",
    "reason": "Based on rental history and location preferences",
    "confidence": 85,
    "aiExplanation": "Recommended based on similar successful rentals"
  }
}
```

### 5. Service Matching

**POST** `/api/ai/services/match`

Intelligently matches service providers to user requirements.

```json
{
  "requirements": {
    "serviceType": "scooter_rental",
    "location": {
      "latitude": 13.7563,
      "longitude": 100.5018,
      "radius": 5000
    },
    "budget": { "min": 200, "max": 500 },
    "timeframe": {
      "start": "2024-01-20T09:00:00Z",
      "end": "2024-01-22T18:00:00Z"
    },
    "preferences": ["helmet_included", "insurance"],
    "specialRequirements": "English speaking staff"
  },
  "userProfile": {
    "previousBookings": ["provider-123"],
    "ratings": [4, 5, 4],
    "preferences": { "communication": "english" }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "providerId": "provider-456",
        "providerName": "Bangkok Scooter Hub",
        "services": ["scooter_rental", "helmet_rental"],
        "matchScore": 94,
        "distance": 1.2,
        "pricing": { "min": 250, "max": 400 },
        "availability": true,
        "rating": 4.7,
        "aiReason": "Perfect location, English support, includes helmet"
      }
    ],
    "searchStrategy": "Location proximity with service requirements matching",
    "alternatives": [
      "Consider extending search radius",
      "Check weekend availability"
    ]
  }
}
```

### 6. AI Service Status

**GET** `/api/ai/status`

Returns the health and metrics of AI providers (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "availableProviders": ["openai", "deepseek", "claude"],
    "health": {
      "openai": true,
      "deepseek": true,
      "claude": false
    },
    "metrics": {
      "deepseek": {
        "provider": "deepseek",
        "requestCount": 1250,
        "averageResponseTime": 850,
        "errorRate": 0.02,
        "tokensUsed": 125000,
        "cost": 26.25,
        "lastUsed": "2024-01-15T10:29:45Z"
      }
    },
    "configuration": {
      "defaultProvider": "deepseek",
      "fallbackProviders": ["deepseek", "openai", "claude"]
    }
  }
}
```

### 7. Cost Estimation

**GET** `/api/ai/cost-estimate?operation=search&dataSize=1000`

Estimates costs for AI operations across providers.

**Response:**

```json
{
  "success": true,
  "data": {
    "estimates": {
      "openai": 0.0015,
      "deepseek": 0.0008,
      "claude": 0.0025
    },
    "optimalProvider": "deepseek",
    "operation": "search",
    "dataSize": 1000
  }
}
```

## Rate Limiting

- **General AI endpoints**: 50 requests per 15 minutes per IP
- **Expensive operations** (recommendations, service matching): 20 requests per
  15 minutes per IP
- **Suggestions**: 30 requests per minute per IP

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "AI service temporarily unavailable",
  "error": "Provider timeout",
  "fallback": "Using basic search functionality"
}
```

## Best Practices

1. **Provider Selection**: Use DeepSeek for cost-effective operations, OpenAI
   for structured data, Claude for creative content
2. **Caching**: Cache AI responses for repeated queries to reduce costs
3. **Fallback**: Always implement fallback mechanisms for when AI services fail
4. **Rate Limiting**: Respect rate limits to avoid service interruption
5. **Cost Monitoring**: Monitor AI usage costs and set alerts
6. **User Context**: Provide rich user context for better AI recommendations

## Integration Examples

### Frontend Integration

```javascript
// Enhanced search with AI
const searchWithAI = async (query, filters) => {
  try {
    const response = await fetch("/api/ai/search/enhanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        filters,
        userContext: getUserContext(),
      }),
    })

    const result = await response.json()
    return result.data
  } catch (error) {
    // Fallback to basic search
    return basicSearch(query, filters)
  }
}

// Real-time suggestions
const getSuggestions = async partialQuery => {
  const response = await fetch(
    `/api/ai/suggestions?q=${encodeURIComponent(partialQuery)}`
  )
  const result = await response.json()
  return result.data.suggestions
}
```

### Backend Integration

```javascript
import { AIService } from "./ai/AIService.js"
import { getAIConfig } from "./ai/config.js"

const aiService = new AIService(getAIConfig())

// Use in your service layer
const enhancedResults = await aiService.enhanceSearch({
  query: userQuery,
  filters: searchFilters,
  userContext: userProfile,
})
```

## Monitoring and Alerts

- Monitor AI provider health and response times
- Set cost alerts for daily/monthly spending
- Track error rates and fallback usage
- Monitor rate limit utilization

## Security Considerations

- API keys are stored securely in environment variables
- Rate limiting prevents abuse
- User authentication required for personalized features
- Input validation on all AI endpoints
- Content moderation for user-generated queries
