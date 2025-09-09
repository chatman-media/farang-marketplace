# API Gateway

Centralized API Gateway for Thailand Marketplace microservices architecture.
Provides service discovery, load balancing, authentication, rate limiting, and
circuit breaker functionality.

## Features

- **Service Discovery**: Automatic discovery and health monitoring of
  microservices
- **Load Balancing**: Intelligent request routing to healthy service instances
- **Circuit Breaker**: Fault tolerance with automatic failure detection and
  recovery
- **Authentication**: JWT-based authentication with role-based access control
- **Rate Limiting**: Redis-backed rate limiting to prevent abuse
- **Request Routing**: Dynamic routing based on URL patterns
- **Health Monitoring**: Real-time health checks and service status monitoring
- **Metrics & Monitoring**: Comprehensive metrics and observability

## Architecture

The API Gateway acts as a single entry point for all client requests, routing
them to appropriate microservices:

```
Client → API Gateway → [User Service, Listing Service, Payment Service, etc.]
```

### Supported Services

- **User Service** (port 3001): Authentication, user management
- **Listing Service** (port 3002): Property and service listings
- **Payment Service** (port 3003): Payment processing
- **Booking Service** (port 3004): Booking management
- **Agency Service** (port 3005): Agency and service provider management
- **AI Service** (port 3006): AI recommendations and search
- **Voice Service** (port 3007): Voice processing and commands
- **CRM Service** (port 3008): Customer relationship management

## Quick Start

### Prerequisites

- Node.js 18+
- Redis (for rate limiting and caching)
- Running microservices

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Development

```bash
# Start in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=1000       # requests per window
RATE_LIMIT_SKIP_SUCCESSFUL=true

# Security
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# Health Check
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000    # 5 seconds

# Circuit Breaker
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000  # 1 minute

# Service URLs (fallback if service discovery disabled)
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
BOOKING_SERVICE_URL=http://localhost:3004
AGENCY_SERVICE_URL=http://localhost:3005
AI_SERVICE_URL=http://localhost:3006
VOICE_SERVICE_URL=http://localhost:3007
CRM_SERVICE_URL=http://localhost:3008
```

## API Endpoints

### Gateway Endpoints

- `GET /` - Gateway information and status
- `GET /health` - Health check with service status
- `GET /metrics` - Performance metrics and statistics
- `GET /services` - Service discovery information

### Proxied Endpoints

All API requests are automatically routed to appropriate services:

- `/api/auth/*` → User Service
- `/api/users/*` → User Service
- `/api/listings/*` → Listing Service
- `/api/real-estate/*` → Listing Service
- `/api/service-providers/*` → Listing Service
- `/api/payments/*` → Payment Service
- `/api/bookings/*` → Booking Service
- `/api/agencies/*` → Agency Service
- `/api/ai/*` → AI Service
- `/api/voice/*` → Voice Service
- `/api/crm/*` → CRM Service

## Authentication

### Public Routes

These routes don't require authentication:

- `/`, `/health`, `/metrics`
- `/api/auth/login`, `/api/auth/register`
- `/api/listings` (browsing)
- `/api/real-estate` (browsing)
- `/api/service-providers` (browsing)

### Protected Routes

All other routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Role-Based Access

Some routes require specific roles:

- `/api/admin/*` - Requires `admin` role
- `/api/agencies/*/manage` - Requires `admin`, `agency_owner`, or
  `agency_manager` role
- `/api/crm/*` - Requires `admin`, `agency_owner`, or `agency_manager` role

## Circuit Breaker

The gateway implements circuit breaker pattern for fault tolerance:

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service is failing, requests are rejected immediately
- **HALF_OPEN**: Testing if service has recovered

### Configuration

- **Threshold**: Number of failures before opening circuit (default: 5)
- **Timeout**: Time to wait before attempting recovery (default: 60 seconds)
- **Recovery**: Requires 3 successful requests to fully close circuit

## Rate Limiting

Redis-backed rate limiting with configurable limits:

- **Window**: Time window for rate limiting (default: 15 minutes)
- **Max Requests**: Maximum requests per window (default: 1000)
- **Skip Successful**: Don't count successful requests (default: true)

## Monitoring

### Health Checks

The gateway continuously monitors service health:

```bash
# Check gateway health
curl http://localhost:3000/health

# Check service discovery
curl http://localhost:3000/services

# Check metrics
curl http://localhost:3000/metrics
```

### Logging

Structured logging with configurable levels:

- `fatal`, `error`, `warn`, `info`, `debug`, `trace`

### Metrics

Available metrics include:

- Service health status
- Circuit breaker states
- Request counts and response times
- Error rates and failure counts

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test ServiceDiscovery.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
api-gateway:
  build: ./services/api-gateway
  ports:
    - "3000:3000"
  environment:
    - NODE_ENV=production
    - JWT_SECRET=${JWT_SECRET}
    - REDIS_HOST=redis
  depends_on:
    - redis
    - user-service
    - listing-service
    # ... other services
```

## Contributing

1. Follow TypeScript strict mode
2. Write tests for new features
3. Update documentation
4. Follow existing code style
5. Ensure all tests pass

## License

Private - Thailand Marketplace Project
