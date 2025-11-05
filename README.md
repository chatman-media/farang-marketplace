# Farang Marketplace

[![CI](https://github.com/chatman-media/farang-marketplace/workflows/CI/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions)
[![Tests](https://github.com/chatman-media/farang-marketplace/workflows/Tests/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions)
[![Coverage](https://github.com/chatman-media/farang-marketplace/workflows/%F0%9F%A7%AA%20Coverage%20Report/badge.svg)](https://github.com/chatman-media/farang-marketplace/actions)
[![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg?token=YOUR_TOKEN_HERE)](https://codecov.io/gh/chatman-media/farang-marketplace)

An intelligent marketplace platform designed for Thailand, connecting locals and
foreigners to buy, sell, rent, and offer services. Supporting English and Thai
as primary languages across web and Telegram platforms.

## Overview

Farang Marketplace serves as a premium marketplace solution specifically
designed for the Thai market, offering:

- **Universal Marketplace**: Buy, sell, rent anything - properties, vehicles,
  equipment, services, and more
- **Dual Primary Languages**: English and Thai (ไทย) as main languages, with
  additional support for Russian (Русский), Chinese (中文), and Arabic (العربية)
- **Integrated CRM**: Multi-channel communication (Email, Telegram, WhatsApp),
  automated follow-ups, and customer relationship management
- **Multi-Platform**: Responsive web application and Telegram bot/mini app
- **Thailand-Focused**: Localized for Thai market with local payment methods,
  regulations, and cultural preferences
- **Premium Positioning**: International branding that appeals to
  quality-conscious Thai and foreign users

## Key Features

### Core Features

- **Smart Search**: Search with filters by category, location, price in English
  and Thai
- **Multi-language Support**: Full functionality in English, Thai, and other
  supported languages
- **Listing Management**: Create, edit, and manage listings with image uploads

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

- **Web Application** (`apps/web`) - Main web interface
- **Admin Panel** (`apps/admin`) - Administrative interface
- **TON App** (`apps/ton-app`) - TON wallet integration
- **Telegram Bot** - Telegram bot for notifications and basic operations
- **API Gateway** (`services/api-gateway`) - Main API entry point
- **User Service** (`services/user-service`) - User management and
  authentication
- **Listing Service** (`services/listing-service`) - Marketplace listings
  management
- **Booking Service** (`services/booking-service`) - Booking and reservations
- **Payment Service** (`services/payment-service`) - Payment processing (TON,
  Stripe, PromptPay)
- **CRM Service** (`services/crm-service`) - Customer relationship management
  and multi-channel communication
- **Shared Packages** (`packages/`) - Logger, shared types, i18n, database
  schema

## Tech Stack

- **Build Tool**: Vite + Bun
- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Fastify microservices
- **Database**: PostgreSQL (Drizzle ORM) + Redis
- **File Storage**: MinIO (S3-compatible)
- **Payments**: TON blockchain, Stripe, PromptPay
- **Communication**: Telegram Bot API, WhatsApp Business API, Nodemailer
- **Telegram**: Telegram Bot + Mini App integration
- **Logging**: Pino
- **Internationalization**: i18next for multi-language support
- **Monorepo**: Turborepo for task orchestration

## Development Setup

### Prerequisites

- Node.js 20+
- Bun (recommended) or npm
- Docker & Docker Compose (optional, for local database)

### Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:chatman-media/farang-marketplace.git
   cd farang-marketplace
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy environment variables for each service:

   ```bash
   # Copy and configure .env files in each service directory
   # See services/*/.env for configuration
   ```

4. Start all services with Turbo UI:
   ```bash
   bun run dev:ui
   ```

This will start:

- Web app: http://localhost:5173
- Admin panel: http://localhost:5174
- API Gateway: http://localhost:3000
- User Service: http://localhost:3001
- Listing Service: http://localhost:3003
- Booking Service: http://localhost:3004
- Payment Service: http://localhost:3009
- CRM Service: http://localhost:3007

### Available Scripts

- `bun run dev` - Start all services in development mode
- `bun run dev:ui` - Start all services with Turbo UI panel
- `bun run build` - Build all applications for production
- `bun run test` - Run tests across all packages
- `bun run lint` - Lint all code with Biome
- `bun run lint:fix` - Fix linting issues automatically

### Database

PostgreSQL with Drizzle ORM. Each service manages its own database connection.

**Option 1: Local Development with Docker** ⭐ Recommended

**Important**: Stop any local PostgreSQL instance first to avoid port conflicts:
```bash
brew services stop postgresql@14  # macOS
# or
sudo systemctl stop postgresql    # Linux
```

Start PostgreSQL and Redis with Docker Compose:
```bash
docker-compose up -d postgres redis
```

Configure `DATABASE_URL` in each service's `.env` file:
```
DATABASE_URL=postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace
```

All `.env.test` files are already configured for Docker PostgreSQL.

**Option 2: Cloud Database (for testing/production)**

Configure cloud PostgreSQL (e.g., Neon, Supabase, AWS RDS):
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**Note**: Integration tests use Neon PostgreSQL cloud database for CI/CD compatibility.

### Redis (for Job Queues)

Payment Service uses Redis for job queues (BullMQ) to process background tasks like:
- Transaction monitoring
- Exchange rate updates
- Payment lifecycle management

**Option 1: Local Development with Docker**
```bash
docker-compose up -d redis
```

**Option 2: Local Redis (without Docker)**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

Configure in `services/payment-service/.env`:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### File Storage

MinIO (S3-compatible) for image and file uploads.

Configure in service `.env`:

```
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

## Project Structure

```
├── apps/
│   ├── web/              # Main web application
│   ├── admin/            # Admin panel
│   └── ton-app/          # TON wallet integration
├── services/
│   ├── api-gateway/      # Main API gateway
│   ├── user-service/     # User management and authentication
│   ├── listing-service/  # Marketplace listings
│   ├── booking-service/  # Booking and reservations
│   ├── payment-service/  # Payment processing
│   └── crm-service/      # CRM and multi-channel communication
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   ├── database-schema/  # Drizzle schema
│   ├── logger/           # Pino logger
│   └── i18n/             # Internationalization
└── telegram/             # Telegram bot and mini app (planned)
```

## Telegram Integration

### Telegram Bot

- Listing notifications and alerts
- Booking confirmations
- Payment status updates
- Direct communication with sellers

### Telegram Mini App (Planned)

- Browse marketplace within Telegram
- Create and manage listings
- Process payments via TON
- Chat with buyers/sellers

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

1. Shared types defined in `packages/shared-types`
2. Database schema in `packages/database-schema` (Drizzle ORM)
3. Centralized logging with `packages/logger` (Pino)
4. Internationalization in `packages/i18n`
5. Each service independently deployable
6. Turborepo orchestrates monorepo tasks
7. Telegram bot integrates with all services for notifications

## Next Steps

This setup provides the foundation for:

- Bilingual marketplace functionality (English/Thai primary)
- Thailand-specific localization with international appeal
- Scalable microservices architecture
- Web application and Telegram bot integration
- Integrated payment systems (TON, Stripe, PromptPay)
- Multi-channel CRM with automated customer engagement
- Telegram Mini App for in-app marketplace experience
- Premium user experience and trust features
