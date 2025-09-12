# AI Service Integration

This document describes how the Listing Service integrates with the dedicated AI
Service for enhanced search, recommendations, and intelligent features.

## Architecture

The Listing Service now uses a **microservices approach** for AI functionality:

- **AI Service** (port 3006): Dedicated AI/ML service with advanced algorithms
- **Listing Service** (port 3002): Integrates with AI Service via HTTP API
- **API Gateway** (port 3000): Routes `/api/ai/*` to AI Service,
  `/api/listings/ai/*` to Listing Service

## Integration Points

### 1. Enhanced Search

**Endpoint**: `POST /api/listings/ai/search/enhanced`

Enhances user search queries with AI understanding:

- Query intent analysis
- Entity extraction
- Smart filtering suggestions
- Result ranking optimization

```javascript
const response = await fetch("/api/listings/ai/search/enhanced", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "scooter rental bangkok",
    filters: { type: "vehicle", priceRange: { min: 200, max: 500 } },
    userContext: {
      userId: "user-123",
      location: { latitude: 13.7563, longitude: 100.5018 },
    },
  }),
})
```

### 2. Query Analysis

**Endpoint**: `POST /api/listings/ai/query/analyze`

Analyzes search queries to understand user intent:

- Intent classification
- Entity extraction
- Confidence scoring
- Suggestion generation

### 3. Recommendations

**Endpoint**: `POST /api/listings/ai/recommendations`

Gets personalized listing recommendations:

- User behavior analysis
- Collaborative filtering
- Content-based recommendations
- Trending items

### 4. Price Suggestions

**Endpoint**: `POST /api/listings/ai/price-suggestions`

AI-powered pricing optimization:

- Market analysis
- Competitive pricing
- Demand forecasting
- Price optimization

### 5. Search Suggestions

**Endpoint**: `GET /api/listings/ai/suggestions?q=partial_query`

Real-time search suggestions:

- Auto-completion
- Query expansion
- Popular searches
- Contextual suggestions

## Configuration

### Environment Variables

```bash
# AI Service URL
AI_SERVICE_URL=http://localhost:3006

# Fallback settings
AI_TIMEOUT=30000
AI_RETRY_ATTEMPTS=3
```

### Service Discovery

The AI Service is automatically discovered through the API Gateway
configuration:

```typescript
// services/api-gateway/src/config/services.ts
"ai-service": {
  name: "AI Service",
  url: process.env.AI_SERVICE_URL || "http://localhost:3006",
  healthCheck: "/health",
  timeout: 30000,
  retries: 3,
}
```

## Error Handling

The integration includes robust error handling with fallbacks:

1. **Circuit Breaker**: Prevents cascading failures
2. **Graceful Degradation**: Falls back to basic search if AI fails
3. **Timeout Handling**: Prevents hanging requests
4. **Retry Logic**: Automatic retry with exponential backoff

```typescript
// Example fallback response
{
  enhancedQuery: originalQuery,
  suggestions: [],
  filters: originalFilters,
  aiInsights: {
    queryUnderstanding: "AI service unavailable",
    searchStrategy: "Basic keyword search",
    recommendations: []
  }
}
```

## Monitoring

### Health Checks

**Endpoint**: `GET /api/listings/ai/status`

Returns AI service health status:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "ai-service",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Metrics

The AI integration tracks:

- Response times
- Success/failure rates
- Fallback usage
- Service availability

## Migration from Local AI

The previous local AI implementation has been replaced with this service
integration:

### Removed Components

- `src/ai/AIService.ts` (local AI service)
- `src/ai/providers/*` (AI provider implementations)
- `src/controllers/AISearchController.ts` (local AI controller)

### New Components

- `src/services/AIClient.ts` (HTTP client for AI service)
- `src/controllers/AIIntegrationController.ts` (integration controller)
- `src/routes/ai.ts` (AI integration routes)

## Benefits

1. **Separation of Concerns**: AI logic is isolated in dedicated service
2. **Scalability**: AI service can be scaled independently
3. **Maintainability**: Easier to update AI algorithms without affecting
   listings
4. **Resource Optimization**: AI service can use specialized hardware/resources
5. **Fault Isolation**: AI failures don't crash the listing service

## Usage Examples

### Frontend Integration

```javascript
// Enhanced search with AI
const searchWithAI = async (query, filters) => {
  try {
    const response = await fetch("/api/listings/ai/search/enhanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, filters, userContext: getUserContext() }),
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
    `/api/listings/ai/suggestions?q=${encodeURIComponent(partialQuery)}`
  )
  const result = await response.json()
  return result.data.suggestions
}
```

### Service-to-Service Communication

```typescript
import { aiClient } from "./services/AIClient"

// In listing controller
const enhancedResults = await aiClient.enhanceSearch({
  query: userQuery,
  filters: searchFilters,
  userContext: { userId, location, preferences },
})
```

## Testing

Run AI integration tests:

```bash
cd services/listing-service
bun test src/test/AIIntegration.test.ts
```

The tests include:

- Service connectivity
- Fallback behavior
- Error handling
- Response validation
