# Farang Marketplace

An intelligent marketplace platform designed for Thailand, connecting locals and
foreigners to buy, sell, rent, and offer services. Enhanced with AI-driven
features including smart search, automated recommendations, and optional voice
assistance, supporting English and Thai as primary languages across web and
mobile platforms.

## Overview

Farang Marketplace serves as a premium marketplace solution specifically
designed for the Thai market, offering:

- **Universal Marketplace**: Buy, sell, rent anything - properties, vehicles,
  equipment, services, and more
- **AI-Enhanced Experience**: Smart search, automated recommendations, and
  optional voice assistance for convenience
- **Dual Primary Languages**: English and Thai (ไทย) as main languages, with
  additional support for Russian (Русский), Chinese (中文), and Arabic (العربية)
- **AI-Powered Features**: Voice recognition, automated translations, smart
  recommendations, and intelligent search
- **Integrated CRM**: Multi-channel communication (Email, Telegram, WhatsApp),
  automated follow-ups, and customer relationship management
- **Cross-Platform**: Responsive web application and native mobile apps
  (iOS/Android)
- **Thailand-Focused**: Localized for Thai market with local payment methods,
  regulations, and cultural preferences
- **Premium Positioning**: International branding that appeals to
  quality-conscious Thai and foreign users

## Key Features

### AI-Enhanced Features

- **Smart Search**: Intelligent search with auto-suggestions and filters in
  English and Thai
- **Automated Recommendations**: AI-powered suggestions based on user
  preferences and behavior
- **Voice Assistance**: Optional voice search and listing creation for added
  convenience
- **Multi-language Support**: Full functionality in English, Thai, and other
  supported languages
- **Intelligent Matching**: AI helps connect buyers and sellers with relevant
  listings

### CRM & Communication

- **Multi-Channel Messaging**: Integrated Email, Telegram, and WhatsApp
  communication
- **Automated Follow-ups**: Smart reminders and nurturing sequences for leads
- **Customer Relationship Management**: Track interactions, preferences, and
  transaction history
- **Lead Warming**: Automated engagement campaigns to convert prospects
- **Communication Hub**: Centralized inbox for all customer communications
  across channels

### Marketplace Categories

- **Real Estate**: Houses, apartments, condos, land, commercial spaces
- **Vehicles**: Cars, motorcycles, boats, trucks, bicycles
- **Services**: Professional services, home services, tutoring, consulting
- **Equipment**: Electronics, tools, furniture, appliances
- **Jobs**: Job postings and freelance opportunities
- **Events**: Event planning, venue rentals, entertainment services

### Localization Features

- **Thai Baht (฿)**: Primary currency with automatic conversion
- **Thai Address System**: Proper Thai address formatting and validation
- **Local Payment Methods**: PromptPay, Thai bank transfers, cash on delivery
- **Thai Regulations**: Compliance with Thai e-commerce and rental laws
- **Cultural Adaptation**: Interface and features adapted for both Thai and
  international users
- **Premium Appeal**: International design standards that convey quality and
  trust

## Target Audience

### Primary Users

- **Thai Locals**: Looking for premium marketplace experience with international
  quality standards
- **Expats & Foreigners**: Living in Thailand and needing reliable marketplace
  services
- **Thai Businesses**: Wanting to reach both local and international customers
- **Tourists**: Short-term visitors needing rentals and services

### Market Positioning

- **Premium Quality**: International branding that signals higher quality and
  reliability
- **Bilingual Focus**: Equal emphasis on English and Thai to serve diverse user
  base
- **Trust & Safety**: Enhanced verification and quality controls
- **Professional Services**: Emphasis on business and professional service
  providers

## Architecture

This is a monorepo containing:

- **Web Application** (`apps/web`) - Main web interface with AI-enhanced
  features
- **Mobile Apps** (`apps/mobile`) - iOS and Android native apps
- **Admin Panel** (`apps/admin`) - Administrative interface
- **AI Service** (`services/ai-service`) - AI recommendations, search, and
  optional voice processing
- **User Service** (`services/user-service`) - User management and
  authentication
- **Listing Service** (`services/listing-service`) - Marketplace listings
  management
- **CRM Service** (`services/crm-service`) - Customer relationship management
  and multi-channel communication
- **Shared Types** (`packages/shared-types`) - Common TypeScript interfaces

## Tech Stack

- **Build Tool**: Vite for fast development and optimized builds
- **Frontend**: React 18 + TypeScript
- **Mobile**: React Native for iOS/Android
- **Backend**: Node.js + Express microservices
- **Database**: PostgreSQL + Redis
- **File Storage**: MinIO (S3-compatible)
- **AI/Voice**: OpenAI API, Web Speech API, speech-to-text services
- **Communication**: Telegram Bot API, WhatsApp Business API, SMTP services
- **Internationalization**: i18next for multi-language support
- **Monorepo**: Turbo for task orchestration

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose

### Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:chatman-media/farang-marketplace.git
   cd farang-marketplace
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

4. Start development services:

   ```bash
   docker-compose up -d
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

This will start:

- Web app: http://localhost:3000
- Admin panel: http://localhost:3001
- AI Service: http://localhost:3003
- User Service: http://localhost:3004

### Available Scripts

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications for production
- `npm run test` - Run tests across all packages
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Database

The PostgreSQL database will be automatically initialized with:

- Required extensions (uuid-ossp, postgis for location data)
- Multi-language text search capabilities
- Thai-specific data types and constraints
- Performance indexes for search and filtering

Access database:

```bash
docker exec -it farang-marketplace-postgres psql -U marketplace_user -d farang_marketplace
```

### File Storage

MinIO is available at:

- API: http://localhost:9000
- Console: http://localhost:9001
- Credentials: minioadmin / minioadmin123

## Project Structure

```
├── apps/
│   ├── web/              # Main web application with voice interface
│   ├── mobile/           # React Native mobile apps
│   └── admin/            # Admin panel
├── services/
│   ├── user-service/     # User management and authentication
│   ├── listing-service/  # Marketplace listings
│   ├── ai-service/       # AI features and recommendations
│   ├── search-service/   # Search and recommendations
│   ├── crm-service/      # CRM and multi-channel communication
│   └── notification-service/ # Notifications and messaging
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   ├── ui-components/    # Shared UI components
│   └── i18n/            # Internationalization resources
├── docker/
│   └── postgres/         # Database initialization
└── docs/                 # Documentation
```

## AI Features Implementation

### Smart Search & Recommendations

- Advanced search algorithms with natural language processing
- Personalized recommendations based on user behavior
- Auto-complete and smart suggestions in multiple languages
- Location-based and category-specific filtering

### Optional Voice Features

- Voice search integration for hands-free browsing
- Voice-assisted listing creation for convenience
- Multi-language voice recognition (English, Thai, and others)
- Speech-to-text for quick input when needed

### AI Processing

- Machine learning algorithms for user preference analysis
- Intelligent matching between buyers and sellers
- Automated content categorization and tagging
- Real-time translation and localization support

## Internationalization

### Supported Languages

1. **English** - Primary international language
2. **Thai (ไทย)** - Primary local language
3. **Russian (Русский)** - Russian expat community
4. **Chinese (中文)** - Chinese tourist and business community
5. **Arabic (العربية)** - Middle Eastern community

### Implementation

- Complete UI translation for all languages
- Right-to-left (RTL) support for Arabic
- Currency and number formatting per locale
- Date and time formatting per locale
- Voice recognition in all supported languages
- Bilingual content management system

## Brand Positioning

### "Farang" Concept

- **International Appeal**: "Farang" (foreigner) suggests international quality
  standards
- **Local Recognition**: Term familiar to Thai users, implying premium foreign
  service
- **Quality Perception**: International branding often perceived as higher
  quality in Thai market
- **Inclusive Branding**: Appeals to both locals seeking premium experience and
  foreigners needing familiar interface

### Market Strategy

- **Premium Positioning**: Higher quality standards and verification processes
- **Bilingual Excellence**: Equal focus on English and Thai user experience
- **Trust Building**: Enhanced security, verification, and customer service
- **Professional Focus**: Emphasis on business services and professional
  providers

## Development Workflow

1. All shared types are defined in `packages/shared-types`
2. UI components are shared across web and mobile in `packages/ui-components`
3. Internationalization resources are centralized in `packages/i18n`
4. Each service is independently deployable
5. Voice features are integrated across all interfaces
6. Bilingual content management for English and Thai
7. Turbo orchestrates tasks across the monorepo

## Next Steps

This setup provides the foundation for:

- Advanced voice recognition and AI features
- Bilingual marketplace functionality (English/Thai primary)
- Thailand-specific localization with international appeal
- Scalable microservices architecture
- Cross-platform mobile and web applications
- Real-time search and recommendations
- Integrated payment and messaging systems
- Multi-channel CRM with automated customer engagement
- Premium user experience and trust features
