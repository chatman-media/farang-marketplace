# 🎤 Voice Service

Advanced voice assistance service for Thailand Marketplace with multi-language
speech-to-text, voice commands, and AI-powered voice interactions.

## 🌟 Features

### 🗣️ **Speech-to-Text**

- **Multi-Provider Support**: Google Cloud Speech, Azure Cognitive Services,
  OpenAI Whisper
- **Multi-Language**: Thai, English, Chinese, Japanese, Korean, and more
- **Real-time Processing**: Fast audio transcription with word-level timing
- **Provider Failover**: Automatic fallback between providers
- **Format Support**: WAV, MP3, FLAC, OGG, WebM, M4A

### 🎯 **Voice Commands**

- **Intent Recognition**: Advanced NLP for command understanding
- **Entity Extraction**: Location, price, property type, and more
- **Context Awareness**: Search, listing, navigation, booking contexts
- **Session Management**: Stateful conversations and command history
- **Multi-language Commands**: Support for Thai and English voice commands

### 🔍 **Voice Search**

- **Natural Language**: "Find apartments for rent in Bangkok"
- **Filter Extraction**: Automatic price, location, and type filtering
- **Search Integration**: Direct integration with marketplace search
- **Voice Feedback**: Spoken confirmation of search actions

### 🏠 **Voice Listing Creation**

- **Guided Flow**: Step-by-step voice-assisted listing creation
- **Multi-step Process**: Title, description, category, price, location
- **Voice Confirmation**: Spoken prompts and confirmations
- **Error Handling**: Graceful handling of voice input errors

### 🧭 **Voice Navigation**

- **Page Navigation**: "Go to home page", "Show my bookings"
- **Command Recognition**: Natural language navigation commands
- **URL Generation**: Automatic redirect URL generation
- **Multi-language**: Thai and English navigation commands

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
bun install

# Copy environment configuration
cp .env.example .env

# Configure your API keys in .env
# GOOGLE_SPEECH_API_KEY=your-google-key
# AZURE_SPEECH_KEY=your-azure-key
# OPENAI_API_KEY=your-openai-key
```

### Development

```bash
# Start development server
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun run test:watch

# Build for production
bun run build

# Start production server
bun start
```

## 📡 API Endpoints

### Core Voice Processing

#### `POST /api/voice/transcribe`

Transcribe audio to text

```json
{
  "audioData": "base64-encoded-audio-or-buffer",
  "language": "th-TH",
  "format": {
    "container": "wav",
    "quality": "high"
  }
}
```

#### `POST /api/voice/command`

Process voice command (audio or text)

```json
{
  "audioData": "base64-audio",
  "text": "Find apartments in Bangkok",
  "language": "en-US",
  "context": {
    "type": "search",
    "currentPage": "/search"
  }
}
```

#### `POST /api/voice/upload`

Upload audio file for processing

```bash
curl -X POST \
  -H "Authorization: Bearer your-jwt-token" \
  -F "audio=@recording.wav" \
  -F "language=th-TH" \
  -F "context={\"type\":\"search\"}" \
  http://localhost:3007/api/voice/upload
```

### Specialized Voice Features

#### `POST /api/voice/search`

Voice-powered search

```json
{
  "text": "หาคอนโดให้เช่าในสุขุมวิท",
  "language": "th-TH"
}
```

#### `POST /api/voice/listing/create`

Voice-assisted listing creation (requires auth)

```json
{
  "text": "I want to create a new listing",
  "language": "en-US"
}
```

#### `POST /api/voice/navigate`

Voice navigation commands

```json
{
  "text": "ไปหน้าหลัก",
  "language": "th-TH"
}
```

### Information & Management

#### `GET /api/voice/languages`

Get supported languages

```json
{
  "success": true,
  "languages": [
    {
      "code": "th-TH",
      "name": "Thai",
      "nativeName": "ไทย",
      "enabled": true,
      "confidence": 0.9,
      "providers": ["google", "azure", "openai"]
    }
  ]
}
```

#### `GET /api/voice/session/:sessionId`

Get session information

```json
{
  "success": true,
  "session": {
    "id": "session_123",
    "userId": "user_456",
    "language": "th-TH",
    "commands": [...],
    "state": {...}
  }
}
```

#### `GET /api/voice/stats`

Get service statistics (admin only)

```json
{
  "success": true,
  "stats": {
    "sessions": {
      "totalSessions": 150,
      "activeSessions": 12,
      "totalCommands": 1250
    },
    "providers": {...},
    "health": {...}
  }
}
```

## 🌍 Multi-Language Support

### Supported Languages

| Language     | Code    | Native Name  | Providers             | Confidence |
| ------------ | ------- | ------------ | --------------------- | ---------- |
| Thai         | `th-TH` | ไทย          | Google, Azure, OpenAI | 90%        |
| English (US) | `en-US` | English (US) | Google, Azure, OpenAI | 95%        |
| English (UK) | `en-GB` | English (UK) | Google, Azure         | 90%        |
| Chinese      | `zh-CN` | 中文 (简体)  | Google, Azure         | 85%        |
| Japanese     | `ja-JP` | 日本語       | Google, Azure         | 85%        |
| Korean       | `ko-KR` | 한국어       | Google, Azure         | 80%        |

### Voice Command Examples

#### English Commands

```
"Find apartments for rent in Bangkok"
"Go to home page"
"Create a new listing"
"Book this property"
"Help me"
```

#### Thai Commands

```
"ค้นหาคอนโดให้เช่าในกรุงเทพ"
"ไปหน้าหลัก"
"สร้างประกาศใหม่"
"จองที่พักนี้"
"ช่วยเหลือ"
```

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
NODE_ENV=development
PORT=3007
HOST=localhost

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Speech-to-Text Providers
GOOGLE_SPEECH_API_KEY=your-google-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=your-region
OPENAI_API_KEY=your-openai-key

# Voice Settings
DEFAULT_LANGUAGE=th-TH
SUPPORTED_LANGUAGES=th-TH,en-US,en-GB,zh-CN,ja-JP,ko-KR
MAX_AUDIO_FILE_SIZE=10485760
VOICE_COMMAND_TIMEOUT=5000

# Integration
AI_SERVICE_URL=http://localhost:3006
DATABASE_URL=postgresql://user:pass@localhost:5432/voice_service
REDIS_URL=redis://localhost:6379
```

### Provider Configuration

#### Google Cloud Speech-to-Text

```bash
GOOGLE_SPEECH_API_KEY=your-api-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

#### Azure Cognitive Services

```bash
AZURE_SPEECH_KEY=your-subscription-key
AZURE_SPEECH_REGION=eastus
```

#### OpenAI Whisper

```bash
OPENAI_API_KEY=your-api-key
OPENAI_ORGANIZATION=your-org-id
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test SpeechToTextService.test.ts

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun run test:watch
```

### Test Categories

- **Speech-to-Text Service**: Provider management, transcription, language
  support
- **Voice Command Service**: Intent recognition, entity extraction, session
  management
- **Voice Controller**: API endpoints, authentication, error handling
- **Integration Tests**: End-to-end voice workflows

## 🏗️ Architecture

### Service Components

```
Voice Service
├── SpeechToTextService     # Multi-provider speech transcription
├── VoiceCommandService     # Command processing and intent recognition
├── VoiceController         # HTTP API endpoints
├── Providers/              # Speech-to-text provider implementations
│   ├── GoogleSpeechProvider
│   ├── AzureSpeechProvider
│   ├── OpenAISpeechProvider
│   └── MockSpeechProvider
├── Middleware/             # Authentication and validation
└── Routes/                 # API route definitions
```

### Data Flow

```
Audio Input → Speech-to-Text → Intent Recognition → Command Execution → Response
     ↓              ↓                ↓                    ↓              ↓
  Base64/Buffer → Transcription → Intent + Entities → Action + Data → JSON Response
```

## 🔒 Security

### Authentication

- **JWT Tokens**: Bearer token authentication for protected endpoints
- **Optional Auth**: Public endpoints with optional user context
- **Role-based Access**: Admin-only endpoints for statistics and management

### Rate Limiting

- **Voice Requests**: 100 requests per minute per user/IP
- **File Uploads**: Size limits and format validation
- **Provider Protection**: Request throttling and failover

### Data Protection

- **Audio Processing**: In-memory processing, no persistent storage
- **Session Data**: Temporary session storage with automatic cleanup
- **API Keys**: Secure environment variable configuration

## 📊 Monitoring

### Health Checks

```bash
# Service health
GET /health

# Provider health
GET /api/voice/health
```

### Statistics

```bash
# Service statistics (admin only)
GET /api/voice/stats

# Provider statistics (admin only)
GET /api/voice/providers/stats
```

### Logging

- **Request Logging**: All API requests with timestamps
- **Error Logging**: Detailed error information and stack traces
- **Performance Metrics**: Processing times and provider usage

## 🚀 Deployment

### Production Build

```bash
bun run build
bun start
```

### Docker Deployment

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3007
CMD ["bun", "start"]
```

### Environment Setup

- Configure all required API keys
- Set up Redis for session storage
- Configure database for analytics (optional)
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
