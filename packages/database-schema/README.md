# @marketplace/database-schema

Shared database schema for Thailand Marketplace project, extended with
comprehensive vehicle rental functionality.

## Overview

This package contains the unified database schema used across all microservices
in the Thailand Marketplace platform. It uses Drizzle ORM for type-safe database
operations and PostgreSQL as the database engine.

**🎉 Recently Extended** with comprehensive vehicle rental features based on
your existing scooter rental models, including maintenance tracking, dual
pricing systems, AI chat integration, and Telegram customer management.

## Features

- **Unified Schema**: Single source of truth for all database tables and
  relationships
- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Microservice Ready**: Designed to be shared across multiple services
- **Migration Support**: Built-in migration management with Drizzle Kit
- **🚗 Vehicle Rental System**: Complete scooter/vehicle rental management
- **🔧 Maintenance Tracking**: Detailed component and service tracking
- **💰 Dual Pricing**: Calendar-based and seasonal pricing systems
- **💬 AI Chat Integration**: DeepSeek AI with chat history
- **📱 Telegram Integration**: Customer management via Telegram

## Installation

```bash
bun add @marketplace/database-schema
```

## Usage

### Basic Connection

```typescript
import { createDatabaseConnection } from "@marketplace/database-schema/connection"

const db = createDatabaseConnection(process.env.DATABASE_URL!)
```

### Using Schema

```typescript
import {
  users,
  vehicles,
  vehicleMaintenance,
  vehicleRentals,
  chatHistory,
  vehicleCalendarPricing,
} from "@marketplace/database-schema"
import { eq } from "drizzle-orm"

// Create a customer with Telegram integration
const customer = await db
  .insert(users)
  .values({
    email: "customer@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+66123456789",
    telegramId: "123456789",
    telegramUsername: "johndoe",
    isClient: true,
    preferredPlatform: "telegram",
    notes: "Regular customer, prefers morning communication",
  })
  .returning()

// Create a vehicle with seasonal pricing
const vehicle = await db
  .insert(vehicles)
  .values({
    listingId: listingId,
    vehicleType: "scooter",
    make: "Honda",
    model: "PCX 150",
    year: 2023,
    power: "150cc",
    oldVehicleNumber: "SCT001",
    gpsTrackerId: "ST123456",
    pricingSystem: "seasonal",
    dailyRate: "300.00",
    oneYearRent: "72000.00",
    decemberPrice: "400.00",
  })
  .returning()

// Track maintenance
const maintenance = await db
  .insert(vehicleMaintenance)
  .values({
    vehicleId: vehicle.id,
    engineOilKm: 5000,
    frontBrakesKm: 12000,
    cigaretteLighter: true,
    battery: "Yuasa 12V",
  })
  .returning()
```

### Migrations

```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate

# Push schema to database (development)
bun run db:push

# Open Drizzle Studio
bun run db:studio
```

## Extended Schema Structure

### 🚗 Vehicle Rental System

- **vehicles**: Extended with GPS tracking, stickers, power specs, dual pricing
  systems
- **vehicleMaintenance**: Comprehensive maintenance tracking (oil, brakes,
  filters, etc.)
- **vehicleRentals**: Complete rental lifecycle management
- **vehicleCalendarPricing**: Date-specific pricing for calendar system

### 👥 Enhanced User Management

- **users**: Extended with Telegram integration, customer status, communication
  preferences
- **chatHistory**: AI-powered chat tracking across platforms
- **aiPromptTemplates**: DeepSeek AI prompt management

### 📊 Core Tables

- **listings**: Main listings table (transportation, tours, services, vehicles,
  products)
- **products**: Product marketplace data (rental/service only)
- **serviceProviders**: Service provider profiles

### 📅 Booking & Availability

- **listingBookings**: Booking records
- **listingAvailability**: Availability calendar

### 📞 CRM & Communication

- **customers**: Customer management
- **leads**: Sales leads
- **communicationHistory**: Communication tracking
- **campaigns**: Marketing campaigns
- **messageTemplates**: Message templates
- **customerSegments**: Customer segmentation
- **automations**: Marketing automation

## 🎯 Key Features from Your Models

### Vehicle Management (from Scooter model)

- GPS tracking with provider support (Sinotrack)
- Sticker and marking management
- Power specifications (125cc, 150cc, etc.)
- Old vehicle number tracking
- Insurance and registration tracking

### Maintenance System (from ScooterMaintenance model)

- Component-based tracking: engine oil, brakes, filters
- Kilometer-based scheduling
- Document management: tech inspection, insurance
- Detailed component status tracking

### Pricing Flexibility

- **Seasonal pricing**: Monthly rates, duration-based pricing
- **Calendar pricing**: Specific date ranges with custom rates
- **Long-term rentals**: 6 months, 1 year options

### AI Integration (from ChatHistory & DeepSeekPromptTemplate)

- Multi-platform chat history (Telegram, WhatsApp, etc.)
- AI response tracking and context management
- Prompt template management for consistent AI behavior

### Customer Management (from Customer model)

- Telegram integration with ID and username
- Customer status tracking (isClient, hasRentedBefore)
- Communication preferences and history
- Manager notes and contact tracking

## Testing

The schema includes comprehensive tests covering all extended functionality:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run specific test file
bun run vitest run src/__tests__/simple-schema.test.ts
```

### Test Coverage

- ✅ User creation with Telegram integration
- ✅ Vehicle creation with dual pricing systems
- ✅ Maintenance record management
- ✅ Rental lifecycle tracking
- ✅ Chat history and AI integration
- ✅ Calendar vs seasonal pricing
- ✅ Database constraints and relationships

## Environment Variables

```env
# Development database
DATABASE_URL=postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace

# Test database
TEST_DATABASE_URL=postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test
```

## Categories and Listing Types

Based on your requirements:

**Categories**: `transportation`, `tours`, `services`, `vehicles`, `products`

**Listing Types**: `rental`, `service` (no sale/purchase for now)

## Development

```bash
# Install dependencies
bun install

# Build package
bun run build

# Type check
bun run type-check

# Generate migrations
bun run db:generate

# Push schema to database
bun run db:push

# Open Drizzle Studio
bun run db:studio
```
