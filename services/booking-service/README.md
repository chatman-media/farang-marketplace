# Booking Service

The Booking Service is a comprehensive microservice that handles all
booking-related operations for the Thailand Marketplace platform. It manages
accommodation bookings, service bookings, availability checking, pricing
calculations, and booking lifecycle management.

## 🚀 Features

### Core Booking Management

- **Accommodation Bookings**: Create and manage property rental bookings
- **Service Bookings**: Handle service provider appointments and consultations
- **Booking Lifecycle**: Complete status management from pending to completed
- **Multi-type Support**: Accommodation, transportation, tours, activities,
  dining, events, and services

### Availability Management

- **Real-time Availability**: Check listing and service provider availability
- **Conflict Resolution**: Prevent double bookings and scheduling conflicts
- **Calendar Management**: Generate availability calendars for listings
- **Date Blocking**: Allow hosts to block dates for maintenance or personal use

### Pricing Engine

- **Dynamic Pricing**: Seasonal, demand-based, and day-of-week pricing
  adjustments
- **Fee Calculation**: Platform fees, payment processing, taxes, and service
  charges
- **Discount System**: Weekly, monthly, and early bird discounts
- **Price Comparison**: Compare pricing across multiple options

### Business Logic

- **Status Transitions**: Enforced booking status workflow
- **Validation**: Comprehensive booking validation and business rules
- **History Tracking**: Complete audit trail of booking changes
- **Dispute Management**: Handle booking disputes and resolutions

## 📋 API Endpoints

### Booking Management

```
POST   /api/bookings                    # Create accommodation booking
POST   /api/bookings/service            # Create service booking
GET    /api/bookings/search             # Search bookings with filters
GET    /api/bookings/:id                # Get booking details
GET    /api/bookings/:id/service        # Get service booking details
PATCH  /api/bookings/:id/status         # Update booking status
GET    /api/bookings/:id/history        # Get booking status history
```

### Availability Management

```
GET    /api/availability/listings/:id/check           # Check listing availability
POST   /api/availability/providers/:id/check         # Check service provider availability
GET    /api/availability/listings/:id/calendar       # Get availability calendar
GET    /api/availability/providers/:id               # Get provider availability
POST   /api/availability/listings/:id/block          # Block dates
POST   /api/availability/listings/:id/unblock        # Unblock dates
GET    /api/availability/listings/:id/upcoming       # Get upcoming bookings
```

### Pricing Engine

```
POST   /api/pricing/booking             # Calculate accommodation pricing
POST   /api/pricing/service             # Calculate service pricing
GET    /api/pricing/estimate/:id        # Get quick price estimate
POST   /api/pricing/dynamic/:id         # Apply dynamic pricing
POST   /api/pricing/breakdown           # Get detailed pricing breakdown
POST   /api/pricing/compare             # Compare multiple pricing options
```

## 🏗️ Architecture

### Database Schema

- **bookings**: Main booking records with status and payment info
- **service_bookings**: Extended data for service-specific bookings
- **booking_status_history**: Complete audit trail of status changes
- **availability_conflicts**: Track booking conflicts and blocked dates
- **disputes**: Handle booking disputes and resolutions

### Services

- **BookingService**: Core booking business logic and CRUD operations
- **AvailabilityService**: Availability checking and conflict management
- **PricingService**: Dynamic pricing calculations and fee management

### Key Features

- **Transaction Safety**: All booking operations use database transactions
- **Conflict Prevention**: Robust availability checking prevents double bookings
- **Status Validation**: Enforced state machine for booking status transitions
- **Comprehensive Logging**: Full audit trail for all booking changes

## 🛠️ Technology Stack

- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Fastify 5.x with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod for request validation
- **Authentication**: JWT-based authentication
- **Testing**: Vitest with comprehensive test coverage
- **Security**: Helmet, CORS, rate limiting

## 🚦 Getting Started

### Prerequisites

- Bun >= 1.0.0
- PostgreSQL >= 14
- Node.js >= 18 (for compatibility)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Generate database migrations
bun run db:generate

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

### Environment Variables

```env
# Server Configuration
PORT=3004
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/thailand_marketplace

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key

# External Services
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3005

# Booking Configuration
BOOKING_ADVANCE_MIN_HOURS=1
BOOKING_ADVANCE_MAX_DAYS=365
BOOKING_CANCELLATION_HOURS=24
AUTO_CONFIRM_TIMEOUT_HOURS=24
PAYMENT_TIMEOUT_MINUTES=30
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test BookingService.test.ts
```

### Test Coverage

- **BookingService**: 25+ tests covering booking creation, status management,
  and search
- **AvailabilityService**: 20+ tests for availability checking and conflict
  management
- **PricingService**: 15+ tests for pricing calculations and dynamic adjustments
- **Controllers**: Integration tests for all API endpoints
- **Validation**: Tests for all request validation rules

## 📊 Business Logic

### Booking Status Flow

```
pending → confirmed → active → completed
    ↓         ↓         ↓
cancelled  cancelled  disputed
```

### Pricing Components

1. **Base Price**: Listing/service base rate
2. **Dynamic Adjustments**: Seasonal, demand, day-of-week
3. **Discounts**: Weekly (7+ nights), monthly (28+ nights), early bird
4. **Fees**: Platform fee (3%), payment processing (2.9%)
5. **Taxes**: VAT (7% in Thailand)

### Availability Rules

- No overlapping bookings for the same listing
- Service providers can't have conflicting appointments
- Hosts can block dates for maintenance
- Minimum advance booking time (configurable)
- Maximum advance booking period (configurable)

## 🔒 Security

- **Authentication**: JWT token validation on protected endpoints
- **Authorization**: Role-based access control (guest, host, admin)
- **Rate Limiting**: Configurable request rate limits
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **CORS**: Configurable cross-origin resource sharing

## 📈 Performance

- **Database Indexing**: Optimized indexes for common queries
- **Connection Pooling**: PostgreSQL connection pooling
- **Caching**: Redis integration for session management
- **Pagination**: Efficient pagination for large result sets
- **Batch Operations**: Optimized bulk operations where applicable

## 🔧 Configuration

### Booking Rules

- **Advance Booking**: Minimum 1 hour, maximum 365 days
- **Cancellation**: 24-hour cancellation policy (configurable)
- **Auto-confirmation**: 24-hour timeout for host confirmation
- **Payment**: 30-minute payment timeout

### Pricing Rules

- **Platform Fee**: 3% of booking value
- **Payment Processing**: 2.9% + fixed fee
- **VAT**: 7% (Thailand standard rate)
- **Weekly Discount**: 10% for 7+ nights
- **Monthly Discount**: Additional 5% for 28+ nights
- **Early Bird**: 5% for 30+ days advance booking

## 🚀 Deployment

### Production Checklist

- [ ] Set secure JWT_SECRET
- [ ] Configure production database
- [ ] Set up Redis for caching
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS certificates

### Docker Support

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3004
CMD ["bun", "start"]
```

## 📝 API Documentation

Detailed API documentation is available at `/api/docs` when running in
development mode. The documentation includes:

- Complete endpoint reference
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error codes and handling

## 🤝 Contributing

1. Follow TypeScript strict mode guidelines
2. Write comprehensive tests for new features
3. Use conventional commit messages
4. Ensure all tests pass before submitting
5. Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for
details.
