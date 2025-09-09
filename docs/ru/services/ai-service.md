# 🤖 AI Service

## 📋 Обзор

AI Service - это сервис искусственного интеллекта для платформы Thailand
Marketplace. Он предоставляет возможности машинного обучения, обработки
естественного языка, компьютерного зрения и рекомендательных систем для
улучшения пользовательского опыта и автоматизации бизнес-процессов.

## 🔧 Технические характеристики

- **Порт разработки**: 3006
- **Framework**: Fastify 5.x (мигрировано с Express.js)
- **Хранение данных**: In-memory кеширование + внешние API
- **Vector DB**: Планируется интеграция с Pinecone/Weaviate
- **ML Framework**: TensorFlow.js, PyTorch (Python микросервисы)
- **Очереди**: Redis + Bull Queue
- **Тестирование**: Vitest (75 тестов)
- **Покрытие тестами**: 90%+
- **Валидация**: Zod schemas
- **Аутентификация**: JWT + Fastify plugins

## 🚀 Миграция на Fastify

**Статус**: ✅ Завершена (Декабрь 2024)

### Изменения после миграции:

- **Контроллеры**: Переименован `FastifyInsightsController` →
  `InsightsController`
- **Роуты**: Обновлена структура без "fastify-" префиксов
- **Middleware**: Оптимизирован `auth.ts` для Fastify
- **Типизация**: Полная совместимость с `AuthenticatedUser` типом
- **Тесты**: Увеличено количество тестов с 5 до 75
- **API**: Улучшена обработка ошибок и валидация

## 🏗️ Архитектура

### Структура проекта (после миграции на Fastify)

```
services/ai-service/
├── src/
│   ├── controllers/     # Fastify контроллеры API
│   │   ├── InsightsController.ts      # (переименован)
│   │   ├── ContentAnalysisController.ts
│   │   ├── RecommendationController.ts
│   │   └── MarketplaceIntegrationController.ts
│   ├── middleware/      # Fastify middleware
│   │   └── auth.ts     # JWT аутентификация (обновлен)
│   ├── routes/         # Fastify роуты (обновлены)
│   │   ├── insights.ts              # Аналитика и инсайты
│   │   ├── content-analysis.ts      # Анализ контента
│   │   └── marketplace-integration.ts # Интеграция с маркетплейсом
│   ├── services/       # Бизнес-логика
│   │   ├── UserBehaviorService.ts   # Анализ поведения
│   │   ├── ContentAnalysisService.ts # Анализ контента
│   │   ├── RecommendationService.ts  # Рекомендации
│   │   └── MarketplaceService.ts     # Интеграция
│   ├── models/         # Типы и интерфейсы
│   │   └── index.ts    # Общие типы
│   ├── test/           # Vitest тесты (75 тестов)
│   │   ├── AIProviderService.test.ts
│   │   ├── ContentAnalysis.test.ts
│   │   ├── RecommendationEngine.test.ts
│   │   ├── UserBehaviorService.test.ts
│   │   ├── MarketplaceIntegrationService.test.ts
│   │   └── setup.ts
│   └── utils/          # Утилиты
├── python/             # Python микросервисы
│   ├── image_processing/
│   ├── text_analysis/
│   └── recommendation_engine/
└── package.json
```

### Основные интерфейсы

#### RecommendationRequest (Запрос рекомендаций)

```typescript
interface RecommendationRequest {
  userId: string
  context?: {
    location?: string
    priceRange?: [number, number]
    propertyType?: string
    amenities?: string[]
  }
  limit?: number
  excludeIds?: string[]
}
```

#### RecommendationResponse (Ответ с рекомендациями)

```typescript
interface RecommendationResponse {
  recommendations: Array<{
    listingId: string
    score: number
    reasons: string[]
    confidence: number
  }>
  totalCount: number
  processingTime: number
  modelVersion: string
}
```

#### ContentAnalysisRequest (Запрос анализа контента)

```typescript
interface ContentAnalysisRequest {
  text: string
  language?: string
  analysisType: ("sentiment" | "keywords" | "quality" | "amenities")[]
}
```

#### ContentAnalysisResponse (Результат анализа контента)

```typescript
interface ContentAnalysisResponse {
  sentiment?: {
    score: number
    label: "positive" | "negative" | "neutral"
  }
  keywords?: string[]
  extractedAmenities?: string[]
  qualityScore?: number
  suggestions?: string[]
  detectedLanguage?: string
}
```

#### UserBehaviorProfile (Профиль поведения пользователя)

```typescript
interface UserBehaviorProfile {
  userId: string
  preferences: {
    propertyTypes: string[]
    priceRange: [number, number]
    locations: string[]
    amenities: string[]
  }
  searchPatterns: {
    frequency: number
    timeOfDay: string[]
    seasonality: Record<string, number>
  }
  interactionHistory: {
    views: number
    bookings: number
    favorites: number
    lastActivity: Date
  }
  score: number
  lastUpdated: Date
}
```

## 🧠 AI Возможности

### 1. Обработка естественного языка (NLP)

#### Анализ описаний недвижимости

```typescript
class PropertyTextAnalyzer {
  async analyzeDescription(description: string): Promise<TextAnalysis> {
    const analysis = await this.nlpModel.analyze(description)

    return {
      sentiment: analysis.sentiment, // Тональность описания
      amenities: analysis.extractedAmenities, // Извлеченные удобства
      keywords: analysis.keywords, // Ключевые слова
      quality: analysis.qualityScore, // Качество описания
      language: analysis.detectedLanguage, // Определенный язык
      suggestions: analysis.improvements, // Предложения по улучшению
    }
  }

  async generateDescription(
    propertyFeatures: PropertyFeatures
  ): Promise<string> {
    const prompt = this.buildPrompt(propertyFeatures)
    const description = await this.gptModel.generate(prompt)

    return this.postProcess(description)
  }
}
```

#### Многоязычная поддержка

- **Автоматический перевод** описаний
- **Определение языка** пользователя
- **Локализация** контента
- **Извлечение сущностей** на разных языках

### 2. Компьютерное зрение

#### Анализ изображений недвижимости

```typescript
class PropertyImageAnalyzer {
  async analyzeImages(imageUrls: string[]): Promise<ImageAnalysis> {
    const analyses = await Promise.all(
      imageUrls.map(url => this.analyzeImage(url))
    )

    return {
      roomTypes: this.extractRoomTypes(analyses),
      amenities: this.detectAmenities(analyses),
      condition: this.assessCondition(analyses),
      style: this.classifyStyle(analyses),
      quality: this.assessImageQuality(analyses),
      suggestions: this.generateSuggestions(analyses),
    }
  }

  async detectObjects(imageUrl: string): Promise<DetectedObject[]> {
    const image = await this.loadImage(imageUrl)
    const predictions = await this.objectDetectionModel.predict(image)

    return predictions.map(pred => ({
      class: pred.class,
      confidence: pred.confidence,
      bbox: pred.boundingBox,
    }))
  }
}
```

#### Возможности анализа изображений

- **Классификация комнат** (спальня, кухня, ванная)
- **Детекция удобств** (бассейн, парковка, балкон)
- **Оценка состояния** недвижимости
- **Определение стиля** интерьера
- **Контроль качества** фотографий

### 3. Рекомендательная система

#### Персонализированные рекомендации

```typescript
class RecommendationEngine {
  async getRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    // Получаем эмбеддинг пользователя
    const userEmbedding = await this.getUserEmbedding(userId)

    // Получаем кандидатов
    const candidates = await this.getCandidateProperties(context)

    // Вычисляем скоры
    const scoredCandidates = await Promise.all(
      candidates.map(async property => {
        const propertyEmbedding = await this.getPropertyEmbedding(property.id)
        const score = this.calculateSimilarity(userEmbedding, propertyEmbedding)

        return {
          property,
          score,
          reasons: this.explainRecommendation(userEmbedding, propertyEmbedding),
        }
      })
    )

    // Сортируем и возвращаем топ-N
    return scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, context.limit || 10)
  }
}
```

#### Типы рекомендаций

- **Collaborative Filtering**: На основе поведения похожих пользователей
- **Content-Based**: На основе характеристик недвижимости
- **Hybrid**: Комбинация подходов
- **Contextual**: С учетом контекста (время, местоположение)

### 4. Динамическое ценообразование

#### Предсказание оптимальной цены

```typescript
class PricingEngine {
  async predictOptimalPrice(
    propertyFeatures: PropertyFeatures,
    marketConditions: MarketConditions
  ): Promise<PricePrediction> {
    const features = this.extractFeatures(propertyFeatures, marketConditions)
    const prediction = await this.pricingModel.predict(features)

    return {
      suggestedPrice: prediction.price,
      confidence: prediction.confidence,
      priceRange: {
        min: prediction.price * 0.9,
        max: prediction.price * 1.1,
      },
      factors: this.explainPricing(features, prediction),
      marketComparison: await this.getMarketComparison(propertyFeatures),
    }
  }

  async analyzePriceHistory(listingId: string): Promise<PriceAnalysis> {
    const history = await this.getPriceHistory(listingId)

    return {
      trend: this.calculateTrend(history),
      volatility: this.calculateVolatility(history),
      seasonality: this.detectSeasonality(history),
      recommendations: this.generatePriceRecommendations(history),
    }
  }
}
```

### 5. Детекция мошенничества

#### Анализ подозрительной активности

```typescript
class FraudDetectionService {
  async analyzeUser(userId: string): Promise<FraudAnalysis> {
    const userBehavior = await this.getUserBehavior(userId)
    const features = this.extractFraudFeatures(userBehavior)

    const fraudScore = await this.fraudModel.predict(features)

    return {
      riskScore: fraudScore,
      riskLevel: this.getRiskLevel(fraudScore),
      suspiciousActivities: this.detectSuspiciousActivities(userBehavior),
      recommendations: this.getSecurityRecommendations(fraudScore),
    }
  }

  async analyzeListing(listingId: string): Promise<ListingFraudAnalysis> {
    const listing = await this.getListing(listingId)

    const checks = {
      imageAuthenticity: await this.checkImageAuthenticity(listing.images),
      priceAnomalies: await this.detectPriceAnomalies(listing),
      descriptionQuality: await this.analyzeDescriptionQuality(
        listing.description
      ),
      ownerVerification: await this.verifyOwner(listing.ownerId),
    }

    return {
      overallRisk: this.calculateOverallRisk(checks),
      checks,
      actions: this.recommendActions(checks),
    }
  }
}
```

## 🌐 API Endpoints

### Анализ текста

#### POST /api/ai/text/analyze

Анализ описания недвижимости

**Запрос:**

```json
{
  "text": "Beautiful 2-bedroom condo with stunning ocean view, modern amenities, and prime location in Phuket",
  "language": "en",
  "analysisType": ["sentiment", "amenities", "quality"]
}
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "sentiment": {
      "score": 0.85,
      "label": "positive"
    },
    "extractedAmenities": ["ocean view", "modern amenities"],
    "qualityScore": 0.78,
    "keywords": ["beautiful", "stunning", "prime location"],
    "suggestions": ["Add more specific amenities", "Include nearby attractions"]
  }
}
```

#### POST /api/ai/text/generate

Генерация описания

#### POST /api/ai/text/translate

Перевод текста

### Анализ изображений

#### POST /api/ai/vision/analyze

Анализ изображений недвижимости

**Запрос:**

```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "analysisType": ["rooms", "amenities", "condition"]
}
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "roomTypes": {
      "bedroom": 2,
      "bathroom": 1,
      "kitchen": 1,
      "living_room": 1
    },
    "detectedAmenities": ["swimming_pool", "balcony", "air_conditioning"],
    "condition": {
      "score": 0.82,
      "label": "excellent"
    },
    "style": "modern",
    "qualityScore": 0.91
  }
}
```

#### POST /api/ai/vision/detect-objects

Детекция объектов на изображении

### Рекомендации

#### GET /api/ai/recommendations/properties

Получение рекомендаций недвижимости

**Параметры:**

```
?userId=user-uuid
&limit=10
&context=search
&location=bangkok
&priceRange=10000-50000
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "listingId": "listing-uuid",
        "score": 0.92,
        "reasons": [
          "Similar to your previous bookings",
          "Matches your preferred amenities",
          "In your favorite area"
        ],
        "property": {
          "title": "Modern Condo in Sukhumvit",
          "price": 25000,
          "location": "Bangkok"
        }
      }
    ],
    "totalCount": 156,
    "modelVersion": "v2.1"
  }
}
```

#### POST /api/ai/recommendations/feedback

Обратная связь по рекомендациям

### Ценообразование

#### POST /api/ai/pricing/predict

Предсказание оптимальной цены

**Запрос:**

```json
{
  "propertyFeatures": {
    "type": "CONDO",
    "bedrooms": 2,
    "bathrooms": 2,
    "area": 80,
    "location": {
      "district": "Sukhumvit",
      "city": "Bangkok"
    },
    "amenities": ["pool", "gym", "parking"]
  },
  "marketConditions": {
    "season": "high",
    "demand": 0.8,
    "supply": 0.6
  }
}
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "suggestedPrice": 28500,
    "confidence": 0.87,
    "priceRange": {
      "min": 25650,
      "max": 31350
    },
    "factors": [
      {
        "factor": "location",
        "impact": 0.35,
        "description": "Prime Sukhumvit location"
      },
      {
        "factor": "amenities",
        "impact": 0.25,
        "description": "Premium amenities package"
      }
    ],
    "marketComparison": {
      "averagePrice": 26800,
      "percentile": 75
    }
  }
}
```

### Детекция мошенничества

#### POST /api/ai/fraud/analyze-user

Анализ пользователя на мошенничество

#### POST /api/ai/fraud/analyze-listing

Анализ объявления на мошенничество

### Чат-бот

#### POST /api/ai/chatbot/message

Отправка сообщения чат-боту

**Запрос:**

```json
{
  "message": "I'm looking for a 2-bedroom condo in Bangkok under 30,000 THB",
  "userId": "user-uuid",
  "sessionId": "session-uuid",
  "language": "en"
}
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "response": "I found several great options for you! Here are 2-bedroom condos in Bangkok under 30,000 THB. Would you like me to show you properties in a specific area like Sukhumvit or Silom?",
    "intent": "property_search",
    "entities": {
      "property_type": "condo",
      "bedrooms": 2,
      "location": "Bangkok",
      "max_price": 30000
    },
    "suggestions": [
      "Show me properties in Sukhumvit",
      "Filter by amenities",
      "See price trends"
    ],
    "sessionId": "session-uuid"
  }
}
```

## 🔄 Фоновые задачи

### Обучение моделей

```typescript
// Переобучение рекомендательной модели
const retrainRecommendationModel = async () => {
  const trainingData = await this.collectTrainingData()
  const model = await this.trainModel(trainingData)

  if (model.performance > this.currentModel.performance) {
    await this.deployModel(model)
    await this.notifyModelUpdate(model)
  }
}

// Обновление эмбеддингов
const updateEmbeddings = async () => {
  const users = await this.getActiveUsers()
  const properties = await this.getActiveProperties()

  await Promise.all([
    this.updateUserEmbeddings(users),
    this.updatePropertyEmbeddings(properties),
  ])
}

// Анализ новых изображений
const processNewImages = async () => {
  const unprocessedImages = await this.getUnprocessedImages()

  for (const image of unprocessedImages) {
    const analysis = await this.analyzeImage(image)
    await this.saveImageAnalysis(image.id, analysis)
  }
}
```

## 🧪 Тестирование

### Покрытие тестами (75 тестов в 5 файлах)

1. **AIProviderService.test.ts** (23 теста) - Провайдеры ИИ
   - Интеграция с OpenAI
   - Обработка API запросов
   - Кеширование результатов
   - Обработка ошибок
   - Лимиты и квоты

2. **ContentAnalysis.test.ts** (12 тестов) - Анализ контента
   - Анализ тональности текста
   - Извлечение ключевых слов
   - Классификация контента
   - Языковая детекция
   - Качество контента

3. **RecommendationEngine.test.ts** (13 тестов) - Рекомендательная система
   - Генерация рекомендаций
   - Расчет схожести
   - Персонализация
   - Фильтрация результатов
   - Метрики качества

4. **UserBehaviorService.test.ts** (17 тестов) - Анализ поведения пользователей
   - Отслеживание активности
   - Построение профилей
   - Предсказание предпочтений
   - Сегментация пользователей
   - Аналитика поведения

5. **MarketplaceIntegrationService.test.ts** (10 тестов) - Интеграция с
   маркетплейсом
   - Синхронизация данных
   - Обработка событий
   - Интеграция с другими сервисами
   - Обновление рекомендаций
   - Мониторинг производительности

### Тестирование моделей

```typescript
// Валидация модели
const validateModel = async (model: AIModel, testData: TestData[]) => {
  const predictions = await Promise.all(
    testData.map(data => model.predict(data.input))
  )

  const metrics = {
    accuracy: calculateAccuracy(predictions, testData),
    precision: calculatePrecision(predictions, testData),
    recall: calculateRecall(predictions, testData),
    f1Score: calculateF1Score(predictions, testData),
  }

  return metrics
}

// A/B тестирование рекомендаций
const abTestRecommendations = async (userId: string) => {
  const modelA = await this.getModel("recommendation_v1")
  const modelB = await this.getModel("recommendation_v2")

  const [recsA, recsB] = await Promise.all([
    modelA.getRecommendations(userId),
    modelB.getRecommendations(userId),
  ])

  // Случайный выбор модели для пользователя
  const selectedModel = Math.random() < 0.5 ? "A" : "B"
  const recommendations = selectedModel === "A" ? recsA : recsB

  // Логируем для анализа
  await this.logABTest(userId, selectedModel, recommendations)

  return recommendations
}
```

### Запуск тестов

```bash
# Все тесты
bun test

# Тесты с покрытием
bun test --coverage

# Тесты моделей
bun test:models

# Интеграционные тесты
bun test:integration

# Нагрузочные тесты
bun test:load
```

## 🚀 Развертывание

### Переменные окружения

```env
# Сервер
PORT=3006
NODE_ENV=production

# Кеширование
REDIS_URL=redis://localhost:6379

# Vector Database (планируется)
# PINECONE_API_KEY=your-pinecone-api-key
# PINECONE_ENVIRONMENT=us-west1-gcp
# PINECONE_INDEX_NAME=thailand-marketplace

# Redis
REDIS_URL=redis://localhost:6379

# ML Models
MODEL_STORAGE_PATH=/app/models
TENSORFLOW_MODEL_URL=https://storage.googleapis.com/models/
HUGGINGFACE_API_KEY=your-huggingface-key

# OpenAI/GPT
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# Google Cloud (для Vision API)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=/app/credentials/gcp-key.json

# AWS (для модели хостинга)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ai-models-bucket

# Интеграции
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002
BOOKING_SERVICE_URL=http://localhost:3003

# Мониторинг
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Лимиты
MAX_REQUESTS_PER_MINUTE=1000
MAX_IMAGE_SIZE_MB=10
MAX_TEXT_LENGTH=10000
```

## 🔄 Интеграции

### Внутренние сервисы

- **User Service**: Профили пользователей для персонализации
- **Listing Service**: Данные недвижимости для анализа
- **Booking Service**: История бронирований для рекомендаций
- **Payment Service**: Данные о транзакциях для детекции мошенничества

### Внешние сервисы

- **OpenAI GPT**: Генерация и анализ текста
- **Google Vision API**: Анализ изображений
- **Hugging Face**: Предобученные NLP модели
- **Pinecone**: Векторная база данных
- **AWS SageMaker**: Хостинг ML моделей

## 📊 Мониторинг и метрики

### Метрики производительности

```typescript
interface AIMetrics {
  // Производительность моделей
  modelAccuracy: Record<string, number>
  averageResponseTime: number
  requestsPerSecond: number

  // Использование
  totalPredictions: number
  activeModels: number
  cacheHitRate: number

  // Качество рекомендаций
  clickThroughRate: number
  conversionRate: number
  userSatisfaction: number

  // Ресурсы
  cpuUsage: number
  memoryUsage: number
  gpuUsage: number
}
```

### Алерты

- Снижение точности моделей
- Высокое время ответа
- Ошибки в предсказаниях
- Превышение лимитов API
- Проблемы с векторной БД

### Дашборды

- Производительность моделей в реальном времени
- Качество рекомендаций
- Использование ресурсов
- A/B тесты результаты
- Детекция аномалий

## 📈 Производительность

### Оптимизации

- Кеширование предсказаний
- Батчинг запросов
- Квантизация моделей
- Асинхронная обработка
- GPU ускорение

### Масштабирование

- Горизонтальное масштабирование
- Балансировка нагрузки
- Автоскейлинг на основе нагрузки
- Распределенное обучение
- Edge deployment для низкой задержки

---

**Контакты для поддержки:**

- 📧 Email: ai-service@thailand-marketplace.com
- 📱 Slack: #ai-service-support
- 🤖 AI Team: ai-team@thailand-marketplace.com
- 📋 Issues:
  [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=ai-service)
