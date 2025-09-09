# 🎙️ Voice Service

## 📋 Обзор

Voice Service - это сервис голосовых технологий для платформы Thailand Marketplace. Он предоставляет возможности распознавания речи, синтеза речи, голосового поиска и голосового управления для улучшения доступности и пользовательского опыта платформы.

## 🔧 Технические характеристики

- **Порт разработки**: 3007
- **Хранение данных**: In-memory обработка + внешние API
- **Аудио обработка**: FFmpeg, Google Cloud Speech, Azure Cognitive Services
- **Аудио обработка**: Web Audio API, FFmpeg
- **Очереди**: Redis + Bull Queue
- **Тестирование**: Vitest (56 тестов в 2 файлах)
- **Покрытие тестами**: 75%+

## 🏗️ Архитектура

### Структура проекта
```
services/voice-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   │   └── VoiceController.ts
│   ├── middleware/      # Промежуточное ПО
│   │   └── auth.ts
│   ├── models/         # Модели данных
│   │   └── index.ts
│   ├── routes/         # Маршруты API
│   │   └── voice.ts
│   ├── services/       # Бизнес-логика
│   │   ├── SpeechToTextService.ts
│   │   ├── VoiceCommandService.ts
│   │   └── providers/  # Внешние провайдеры
│   ├── test/           # Vitest тесты (56 тестов)
│   │   ├── SpeechToTextService.test.ts (24 теста)
│   │   ├── VoiceCommandService.test.ts (32 теста)
│   │   └── setup.ts
│   ├── utils/          # Утилиты
│   ├── app.ts          # Fastify приложение
│   └── index.ts        # Точка входа
└── package.json
```

### Основные интерфейсы

#### SpeechRecognitionRequest (Запрос распознавания речи)
```typescript
interface SpeechRecognitionRequest {
  audioData: string;             // Base64 encoded audio
  format: 'wav' | 'mp3' | 'ogg' | 'webm';
  language?: string;             // Язык (th-TH, en-US, ru-RU, etc.)
  enhanceAudio?: boolean;        // Улучшение качества аудио
  enablePunctuation?: boolean;   // Включить пунктуацию
}
```

#### SpeechRecognitionResponse (Результат распознавания речи)
```typescript
interface SpeechRecognitionResponse {
  text: string;                  // Распознанный текст
  confidence: number;            // Уверенность (0-1)
  language: string;              // Определенный язык
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
  processingTime: number;        // Время обработки (мс)
}
```

#### VoiceCommandRequest (Запрос голосовой команды)
```typescript
interface VoiceCommandRequest {
  audioData: string;             // Base64 encoded audio
  userId?: string;               // ID пользователя
  sessionId?: string;            // ID сессии
  context?: {
    currentPage?: string;
    location?: string;
    preferences?: Record<string, any>;
  };
}
```

#### VoiceCommandResponse (Результат обработки команды)
```typescript
interface VoiceCommandResponse {
  recognizedText: string;        // Распознанный текст
  intent: string;                // Определенное намерение
  entities: Record<string, any>; // Извлеченные сущности
  command?: {
    action: string;
    parameters: Record<string, any>;
  };
  result?: any;                  // Результат выполнения команды
  response: {
    text: string;                // Текстовый ответ
    audioUrl?: string;           // URL аудио ответа
  };
  confidence: number;            // Уверенность
  processingTime: number;        // Время обработки
}
```

#### SupportedLanguage (Поддерживаемые языки)
```typescript
interface SupportedLanguage {
  code: string;                  // Код языка (th-TH, en-US)
  name: string;                  // Название языка
  nativeName: string;            // Название на родном языке
  speechToText: boolean;         // Поддержка STT
  textToSpeech: boolean;         // Поддержка TTS
  voiceCommands: boolean;        // Поддержка голосовых команд
}
```

## 🎤 Возможности распознавания речи

### Многоязычное распознавание
```typescript
class SpeechRecognitionService {
  async recognizeSpeech(
    audioBuffer: ArrayBuffer,
    options: RecognitionOptions
  ): Promise<RecognitionResult> {
    
    // Предобработка аудио
    const processedAudio = await this.preprocessAudio(audioBuffer, {
      noiseReduction: options.enhanceAudio,
      normalization: true,
      format: 'wav'
    });
    
    // Определение языка (если не указан)
    const language = options.language || 
      await this.detectLanguage(processedAudio);
    
    // Распознавание речи
    const recognition = await this.speechEngine.recognize(
      processedAudio,
      language
    );
    
    return {
      text: recognition.text,
      confidence: recognition.confidence,
      language: recognition.detectedLanguage,
      alternatives: recognition.alternatives,
      timestamps: recognition.wordTimestamps,
      processingTime: recognition.processingTime
    };
  }
  
  async recognizeStream(
    audioStream: ReadableStream,
    options: StreamRecognitionOptions
  ): Promise<AsyncIterable<PartialRecognitionResult>> {
    
    const recognitionStream = this.speechEngine.createStream({
      language: options.language,
      interimResults: options.interimResults,
      punctuation: options.enablePunctuation
    });
    
    // Обработка потока
    audioStream.pipeTo(recognitionStream);
    
    return recognitionStream.results();
  }
}
```

### Поддерживаемые языки
- **Тайский** (th-TH) - основной язык
- **Английский** (en-US, en-GB) - международный
- **Русский** (ru-RU) - для русскоязычных пользователей
- **Китайский** (zh-CN, zh-TW) - для китайских туристов
- **Японский** (ja-JP) - для японских туристов
- **Корейский** (ko-KR) - для корейских туристов

### Улучшение качества
```typescript
class AudioEnhancementService {
  async enhanceAudio(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    const enhancements = [
      this.noiseReduction,
      this.echoCancellation,
      this.volumeNormalization,
      this.speechEnhancement
    ];
    
    let enhanced = audioBuffer;
    for (const enhancement of enhancements) {
      enhanced = await enhancement(enhanced);
    }
    
    return enhanced;
  }
  
  private async noiseReduction(audio: ArrayBuffer): Promise<ArrayBuffer> {
    // Применение фильтра шумоподавления
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(audio);
    
    // Создание фильтра
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 300; // Убираем низкочастотный шум
    
    // Обработка
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(filter);
    
    // Возвращаем обработанный аудио
    return this.audioBufferToArrayBuffer(audioBuffer);
  }
}
```

## 🔊 Синтез речи (TTS)

### Многоголосный синтез
```typescript
class TextToSpeechService {
  async synthesizeSpeech(
    text: string,
    options: SynthesisOptions
  ): Promise<SynthesisResult> {
    
    // Предобработка текста
    const processedText = await this.preprocessText(text, {
      language: options.language,
      ssml: options.enableSSML,
      pronunciation: options.customPronunciation
    });
    
    // Выбор голоса
    const voice = await this.selectVoice({
      language: options.language,
      gender: options.voiceGender,
      style: options.voiceStyle,
      userId: options.userId // Для персонализации
    });
    
    // Синтез
    const synthesis = await this.ttsEngine.synthesize(processedText, {
      voice: voice,
      rate: options.speechRate || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0,
      format: options.audioFormat || 'mp3'
    });
    
    return {
      audioUrl: synthesis.audioUrl,
      audioBuffer: synthesis.audioBuffer,
      duration: synthesis.duration,
      format: synthesis.format,
      voice: voice,
      processingTime: synthesis.processingTime
    };
  }
  
  async synthesizeSSML(
    ssml: string,
    options: SSMLSynthesisOptions
  ): Promise<SynthesisResult> {
    
    // Валидация SSML
    const validatedSSML = await this.validateSSML(ssml);
    
    // Парсинг SSML тегов
    const parsedSSML = await this.parseSSML(validatedSSML);
    
    // Синтез с учетом SSML разметки
    return await this.ttsEngine.synthesizeSSML(parsedSSML, options);
  }
}
```

### Доступные голоса
```typescript
interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  style: 'standard' | 'neural' | 'premium';
  description: string;
}

const availableVoices: VoiceOption[] = [
  // Тайские голоса
  {
    id: 'th-TH-Premwadee',
    name: 'Premwadee',
    language: 'th-TH',
    gender: 'female',
    style: 'neural',
    description: 'Естественный женский тайский голос'
  },
  {
    id: 'th-TH-Niran',
    name: 'Niran',
    language: 'th-TH',
    gender: 'male',
    style: 'neural',
    description: 'Естественный мужской тайский голос'
  },
  
  // Английские голоса
  {
    id: 'en-US-AriaNeural',
    name: 'Aria',
    language: 'en-US',
    gender: 'female',
    style: 'neural',
    description: 'Современный американский женский голос'
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy',
    language: 'en-US',
    gender: 'male',
    style: 'neural',
    description: 'Современный американский мужской голос'
  },
  
  // Русские голоса
  {
    id: 'ru-RU-SvetlanaNeural',
    name: 'Светлана',
    language: 'ru-RU',
    gender: 'female',
    style: 'neural',
    description: 'Естественный русский женский голос'
  }
];
```

## 🎯 Голосовые команды

### Система команд
```typescript
class VoiceCommandService {
  async processCommand(
    recognizedText: string,
    context: CommandContext
  ): Promise<CommandResult> {
    
    // Нормализация текста
    const normalizedText = this.normalizeText(recognizedText);
    
    // Определение намерения
    const intent = await this.intentClassifier.classify(normalizedText);
    
    // Извлечение сущностей
    const entities = await this.entityExtractor.extract(normalizedText);
    
    // Поиск подходящей команды
    const command = await this.findMatchingCommand(intent, entities, context);
    
    if (!command) {
      return this.handleUnknownCommand(recognizedText, context);
    }
    
    // Выполнение команды
    const result = await this.executeCommand(command, entities, context);
    
    return {
      command: command,
      result: result,
      response: await this.generateResponse(command, result, context),
      confidence: intent.confidence
    };
  }
  
  private async executeCommand(
    command: VoiceCommand,
    entities: Record<string, any>,
    context: CommandContext
  ): Promise<any> {
    
    switch (command.action) {
      case 'SEARCH_PROPERTIES':
        return await this.searchProperties(entities, context);
        
      case 'BOOK_PROPERTY':
        return await this.bookProperty(entities, context);
        
      case 'GET_DIRECTIONS':
        return await this.getDirections(entities, context);
        
      case 'CALL_SUPPORT':
        return await this.callSupport(entities, context);
        
      case 'TRANSLATE_TEXT':
        return await this.translateText(entities, context);
        
      default:
        throw new Error(`Unknown command action: ${command.action}`);
    }
  }
}
```

### Примеры команд

#### Поиск недвижимости
```
"Найди квартиру в Бангкоке до 30 тысяч бат"
"Show me condos near BTS Asok"
"หาคอนโดใกล้ BTS อโศก"
```

#### Бронирование
```
"Забронируй эту квартиру на завтра"
"Book this condo for next week"
"จองคอนโดนี้สำหรับสัปดาห์หน้า"
```

#### Навигация
```
"Как добраться до этого отеля?"
"Get directions to Siam Paragon"
"บอกทางไปสยามพารากอน"
```

#### Поддержка
```
"Позвони в службу поддержки"
"Call customer service"
"โทรหาฝ่ายบริการลูกค้า"
```

## 🌐 API Endpoints

### Распознавание речи

#### POST /api/voice/recognize
Распознавание аудио файла

**Запрос:**
```json
{
  "audioData": "base64-encoded-audio",
  "format": "wav",
  "language": "th-TH",
  "enhanceAudio": true,
  "enablePunctuation": true
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "text": "หาคอนโดใกล้ BTS อโศก",
    "confidence": 0.94,
    "language": "th-TH",
    "alternatives": [
      {
        "text": "หาคอนโดใกล้บีทีเอสอโศก",
        "confidence": 0.87
      }
    ],
    "processingTime": 1250
  }
}
```

#### POST /api/voice/recognize/stream
Потоковое распознавание речи

#### POST /api/voice/recognize/realtime
Распознавание в реальном времени

### Синтез речи

#### POST /api/voice/synthesize
Синтез речи из текста

**Запрос:**
```json
{
  "text": "ยินดีต้อนรับสู่ Thailand Marketplace",
  "language": "th-TH",
  "voice": "th-TH-Premwadee",
  "speechRate": 1.0,
  "pitch": 1.0,
  "volume": 0.8,
  "format": "mp3"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://storage.example.com/audio/synthesis-uuid.mp3",
    "duration": 3.2,
    "format": "mp3",
    "voice": {
      "id": "th-TH-Premwadee",
      "name": "Premwadee",
      "language": "th-TH"
    },
    "processingTime": 890
  }
}
```

#### POST /api/voice/synthesize/ssml
Синтез с SSML разметкой

**Запрос:**
```json
{
  "ssml": "<speak><prosody rate='slow'>ยินดีต้อนรับ</prosody> <break time='500ms'/> <prosody pitch='high'>Thailand Marketplace</prosody></speak>",
  "voice": "th-TH-Premwadee",
  "format": "wav"
}
```

### Голосовые команды

#### POST /api/voice/command
Обработка голосовой команды

**Запрос:**
```json
{
  "audioData": "base64-encoded-audio",
  "userId": "user-uuid",
  "sessionId": "session-uuid",
  "context": {
    "currentPage": "search",
    "location": "Bangkok",
    "preferences": {
      "language": "th-TH"
    }
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "recognizedText": "หาคอนโดใกล้ BTS อโศก",
    "intent": "SEARCH_PROPERTIES",
    "entities": {
      "propertyType": "condo",
      "location": "BTS Asok",
      "proximity": "near"
    },
    "command": {
      "action": "SEARCH_PROPERTIES",
      "parameters": {
        "type": "CONDO",
        "near": "BTS Asok Station"
      }
    },
    "result": {
      "searchResults": 15,
      "redirectUrl": "/search?type=condo&near=bts-asok"
    },
    "response": {
      "text": "พบคอนโด 15 แห่งใกล้ BTS อโศก กำลังแสดงผลลัพธ์",
      "audioUrl": "https://storage.example.com/audio/response-uuid.mp3"
    }
  }
}
```

#### GET /api/voice/commands
Получение списка доступных команд

### Голосовые сессии

#### POST /api/voice/session/start
Начало голосовой сессии

#### PUT /api/voice/session/:id/end
Завершение голосовой сессии

#### GET /api/voice/session/:id/history
История взаимодействий в сессии

### Голосовые профили

#### GET /api/voice/profile
Получение голосового профиля пользователя

#### PUT /api/voice/profile
Обновление голосового профиля

#### POST /api/voice/profile/calibrate
Калибровка голосового профиля

### Настройки и конфигурация

#### GET /api/voice/voices
Список доступных голосов

#### GET /api/voice/languages
Поддерживаемые языки

#### POST /api/voice/feedback
Обратная связь по качеству распознавания

## 🔄 Фоновые задачи

### Обработка аудио
```typescript
// Обработка загруженных аудио файлов
const processAudioFiles = async () => {
  const unprocessedFiles = await this.getUnprocessedAudioFiles();
  
  for (const file of unprocessedFiles) {
    try {
      // Улучшение качества
      const enhanced = await this.enhanceAudio(file.audioData);
      
      // Распознавание речи
      const recognition = await this.recognizeSpeech(enhanced);
      
      // Сохранение результатов
      await this.saveRecognitionResult(file.id, recognition);
      
      // Обновление статуса
      await this.updateFileStatus(file.id, 'PROCESSED');
      
    } catch (error) {
      await this.handleProcessingError(file.id, error);
    }
  }
};

// Обучение голосовых моделей
const trainVoiceModels = async () => {
  const trainingData = await this.collectTrainingData();
  
  if (trainingData.length > 1000) {
    const model = await this.trainRecognitionModel(trainingData);
    
    if (model.accuracy > this.currentModel.accuracy) {
      await this.deployModel(model);
    }
  }
};

// Очистка старых аудио файлов
const cleanupOldAudioFiles = async () => {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней
  
  const oldFiles = await this.getAudioFilesOlderThan(cutoffDate);
  
  for (const file of oldFiles) {
    await this.deleteAudioFile(file.id);
  }
};
```

## 🧪 Тестирование

### Покрытие тестами (56 тестов в 2 файлах)

1. **SpeechToTextService.test.ts** (24 теста) - Распознавание речи
   - Точность распознавания
   - Многоязычная поддержка (тайский, английский, русский)
   - Обработка различных аудио форматов
   - Обработка ошибок и валидация
   - Интеграция с Google Cloud Speech
   - Интеграция с Azure Cognitive Services
   - Производительность и лимиты

2. **VoiceCommandService.test.ts** (32 теста) - Голосовые команды
   - Обработка голосовых команд
   - Определение намерений (поиск, бронирование, навигация)
   - Извлечение сущностей из речи
   - Многоязычная поддержка команд
   - Контекстная обработка
   - Генерация ответов
   - Интеграция с другими сервисами

### Тестирование качества
```typescript
// Тест точности распознавания
const testRecognitionAccuracy = async () => {
  const testCases = await this.loadTestAudioFiles();
  let correctRecognitions = 0;
  
  for (const testCase of testCases) {
    const result = await this.recognizeSpeech(testCase.audio);
    
    if (this.compareTexts(result.text, testCase.expectedText) > 0.9) {
      correctRecognitions++;
    }
  }
  
  const accuracy = correctRecognitions / testCases.length;
  expect(accuracy).toBeGreaterThan(0.85); // Минимум 85% точности
};

// Тест качества синтеза
const testSynthesisQuality = async () => {
  const testTexts = [
    'สวัสดีครับ ยินดีต้อนรับ',
    'Hello, welcome to Thailand Marketplace',
    'Добро пожаловать в Thailand Marketplace'
  ];
  
  for (const text of testTexts) {
    const synthesis = await this.synthesizeSpeech(text);
    
    expect(synthesis.audioUrl).toBeDefined();
    expect(synthesis.duration).toBeGreaterThan(0);
    expect(synthesis.processingTime).toBeLessThan(5000); // Максимум 5 секунд
  }
};
```

### Запуск тестов
```bash
# Все тесты
bun test

# Тесты с покрытием
bun test --coverage

# Тесты производительности
bun test:performance

# Тесты качества аудио
bun test:audio-quality
```

## 🚀 Развертывание

### Переменные окружения
```env
# Сервер
PORT=3007
NODE_ENV=production

# Кеширование (опционально)
# REDIS_URL=redis://localhost:6379

# Аудио обработка
FFMPEG_PATH=/usr/bin/ffmpeg
AUDIO_STORAGE_PATH=/app/audio
MAX_AUDIO_FILE_SIZE=50MB
AUDIO_FORMATS=wav,mp3,ogg,webm

# Speech-to-Text
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=/app/credentials/gcp-key.json
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=southeastasia

# Text-to-Speech
AWS_POLLY_ACCESS_KEY=your-aws-access-key
AWS_POLLY_SECRET_KEY=your-aws-secret-key
AWS_POLLY_REGION=ap-southeast-1

# Модели
MODEL_STORAGE_PATH=/app/voice-models
CUSTOM_MODEL_ENDPOINT=https://api.example.com/voice-models

# Интеграции
AI_SERVICE_URL=http://localhost:3006
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002

# Мониторинг
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Лимиты
MAX_REQUESTS_PER_MINUTE=500
MAX_SESSION_DURATION=3600
MAX_AUDIO_DURATION=300
```

## 🔄 Интеграции

### Внутренние сервисы
- **AI Service**: Обработка намерений и сущностей
- **User Service**: Голосовые профили пользователей
- **Listing Service**: Голосовой поиск недвижимости
- **Booking Service**: Голосовое бронирование

### Внешние сервисы
- **Google Cloud Speech-to-Text**: Распознавание речи
- **Azure Cognitive Services**: Многоязычное распознавание
- **AWS Polly**: Синтез речи
- **OpenAI Whisper**: Локальное распознавание
- **Mozilla DeepSpeech**: Open-source распознавание

## 📊 Мониторинг и метрики

### Метрики производительности
```typescript
interface VoiceMetrics {
  // Распознавание речи
  recognitionAccuracy: number;
  averageRecognitionTime: number;
  recognitionRequestsPerSecond: number;
  
  // Синтез речи
  synthesisQuality: number;
  averageSynthesisTime: number;
  synthesisRequestsPerSecond: number;
  
  // Голосовые команды
  commandSuccessRate: number;
  averageCommandProcessingTime: number;
  popularCommands: string[];
  
  // Качество аудио
  averageNoiseLevel: number;
  averageSpeechClarity: number;
  audioQualityScore: number;
  
  // Использование
  activeSessions: number;
  totalInteractions: number;
  averageSessionDuration: number;
  
  // Ресурсы
  cpuUsage: number;
  memoryUsage: number;
  audioStorageUsage: number;
}
```

### Алерты
- Снижение точности распознавания
- Высокое время обработки
- Ошибки в синтезе речи
- Превышение лимитов API
- Проблемы с качеством аудио

### Дашборды
- Качество распознавания в реальном времени
- Популярные голосовые команды
- Использование различных языков
- Производительность синтеза речи
- Статистика голосовых сессий

## 📈 Производительность

### Оптимизации
- Кеширование результатов распознавания
- Предварительная загрузка голосовых моделей
- Сжатие аудио файлов
- Потоковая обработка
- Локальное кеширование синтезированной речи

### Масштабирование
- Горизонтальное масштабирование
- Балансировка нагрузки
- CDN для аудио файлов
- Региональные развертывания
- Edge computing для низкой задержки

---

**Контакты для поддержки:**
- 📧 Email: voice-service@thailand-marketplace.com
- 📱 Slack: #voice-service-support
- 🎙️ Voice Team: voice-team@thailand-marketplace.com
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=voice-service)