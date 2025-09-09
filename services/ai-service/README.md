# 🤖 AI Service - Thailand Marketplace

Advanced AI-powered service providing intelligent recommendations, content analysis, and user behavior insights for the Thailand Marketplace platform.

## 🎯 **Features**

### 🧠 **Multi-Provider AI Integration**

- **OpenAI GPT-4/3.5** - Advanced language understanding
- **DeepSeek** - Cost-effective AI processing
- **Claude (Anthropic)** - High-quality text analysis
- **Mock Provider** - Testing and development
- **Automatic Failover** - Seamless provider switching
- **Rate Limiting** - Cost optimization and quota management

### 📊 **Recommendation Engine**

- **Collaborative Filtering** - User-based recommendations
- **Content-Based Filtering** - Item similarity matching
- **AI-Enhanced Scoring** - Machine learning powered suggestions
- **Context-Aware** - Location, budget, and preference aware
- **Real-time Personalization** - Dynamic user profile building
- **Diversity Application** - Balanced recommendation variety

### 📝 **Content Analysis**

- **Sentiment Analysis** - Emotional tone detection
- **Keyword Extraction** - Important term identification
- **Content Categorization** - Automatic classification
- **Language Detection** - Multi-language support
- **Content Moderation** - Inappropriate content filtering
- **Quality Assessment** - Content quality scoring
- **Batch Processing** - Efficient bulk analysis

### 👤 **User Behavior Analytics**

- **Real-time Tracking** - Live user action monitoring
- **Pattern Recognition** - Behavior trend analysis
- **Insight Generation** - AI-powered user insights
- **Market Analytics** - Platform-wide trend analysis
- **User Segmentation** - Automatic user categorization
- **Conversion Tracking** - Performance metrics

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+ or Bun
- TypeScript
- Environment variables configured

### Installation

```bash
cd services/ai-service
bun install
```

### Environment Setup

```bash
cp .env.example .env
# Configure your environment variables
```

### Development

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Type checking
bun run type-check
```

## 📡 **API Endpoints**

### 🎯 **Recommendations**

```http
# Get personalized recommendations
GET /api/recommendations?type=listings&limit=20&category=electronics

# Get similar items
GET /api/recommendations/similar/:itemId?limit=10

# Get trending items
GET /api/recommendations/trending?category=fashion&location=Bangkok

# Track user behavior
POST /api/recommendations/behavior
{
  "action": "view",
  "entityType": "listing",
  "entityId": "listing_123",
  "metadata": { "category": "electronics" }
}
```

### 📝 **Content Analysis**

```http
# Analyze content
POST /api/content-analysis/analyze
{
  "type": "listing",
  "content": {
    "title": "Amazing Product",
    "description": "This is a great product..."
  },
  "language": "en"
}

# Sentiment analysis only
POST /api/content-analysis/sentiment
{
  "text": "This product is amazing!",
  "language": "en"
}

# Extract keywords
POST /api/content-analysis/keywords
{
  "text": "Modern apartment in Bangkok with great amenities",
  "language": "en"
}

# Batch analysis
POST /api/content-analysis/batch-analyze
{
  "items": [
    {
      "type": "listing",
      "content": { "title": "Product 1", "description": "..." }
    }
  ]
}
```

### 📊 **User Insights**

```http
# Track user behavior
POST /api/insights/behavior
{
  "action": "purchase",
  "entityType": "listing",
  "entityId": "listing_456",
  "sessionId": "session_123",
  "metadata": { "category": "electronics", "price": 1500 }
}

# Get user insights
GET /api/insights/user/:userId?type=preference&actionable=true

# Analyze user behavior (generate new insights)
POST /api/insights/user/:userId/analyze

# Get market insights (Admin only)
GET /api/insights/market?type=trend&category=electronics

# Get user segments (Admin only)
GET /api/insights/segments

# Get behavior trends (Admin only)
GET /api/insights/trends?timeframe=7d&category=fashion
```

## 🔧 **Configuration**

### Environment Variables

```bash
# Server Configuration
PORT=3006
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Security
JWT_SECRET=your-jwt-secret
HELMET_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window

# AI Providers
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
CLAUDE_API_KEY=your-claude-key
AI_PROVIDER=openai        # primary provider

# Processing
AI_BATCH_SIZE=10
BEHAVIOR_FLUSH_INTERVAL=300000  # 5 minutes

# External Services
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002
```

## 🏗️ **Architecture**

### Service Structure

```
src/
├── controllers/          # API endpoint handlers
│   ├── RecommendationController.ts
│   ├── ContentAnalysisController.ts
│   └── InsightsController.ts
├── services/            # Business logic
│   ├── AIProviderService.ts
│   ├── RecommendationEngine.ts
│   ├── ContentAnalysisService.ts
│   └── UserBehaviorService.ts
├── models/              # TypeScript interfaces
│   └── index.ts
├── middleware/          # Express middleware
│   └── auth.ts
├── routes/              # Route definitions
│   ├── recommendations.ts
│   ├── content-analysis.ts
│   └── insights.ts
└── test/               # Test files
    ├── setup.ts
    └── *.test.ts
```

## 🧪 **Testing**

### Test Coverage

- **23 Unit Tests** - Core functionality testing
- **Provider Integration** - AI provider testing
- **Rate Limiting** - Quota management testing
- **Error Handling** - Failure scenario testing
- **Mock Providers** - Development testing

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test src/test/AIProviderService.test.ts

# Watch mode
bun test --watch
```

## 📈 **Performance**

### Optimization Features

- **Provider Failover** - Automatic switching on failure
- **Rate Limiting** - Cost and quota management
- **Batch Processing** - Efficient bulk operations
- **Caching** - Response caching for repeated requests
- **Async Processing** - Non-blocking operations

### Monitoring

- **Provider Statistics** - Usage and performance metrics
- **Cost Tracking** - AI provider cost monitoring
- **Rate Limit Monitoring** - Quota usage tracking
- **Error Tracking** - Failure rate monitoring

## 🔒 **Security**

### Authentication & Authorization

- **JWT Authentication** - Secure token-based auth
- **Role-Based Access** - User, Admin, Agency roles
- **Resource Protection** - User-specific data access
- **Rate Limiting** - DDoS protection

### Data Protection

- **Input Validation** - Request sanitization
- **Content Moderation** - Inappropriate content filtering
- **Secure Headers** - Helmet.js security
- **CORS Configuration** - Cross-origin protection

## 🚀 **Deployment**

### Production Setup

```bash
# Build for production
bun run build

# Start production server
bun start

# Health check
curl http://localhost:3006/health
```

### Health Monitoring

```http
# Health check endpoint
GET /health

# Service status with metrics
GET /status

# Provider statistics
GET /api/providers/stats
```

---

**AI Service is production-ready with comprehensive AI capabilities, robust testing, and enterprise-grade security!** 🚀
