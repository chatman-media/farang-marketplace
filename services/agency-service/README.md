# Agency Service

A comprehensive agency management service for the Thailand Marketplace platform, handling agency registration, verification, service offerings, and commission management.

## 🚀 Features

### 🏢 Agency Management
- **Agency Registration**: Complete agency onboarding with verification process
- **Service Offerings**: Manage multiple service types and categories
- **Coverage Areas**: Define geographical service coverage with location-based matching
- **Commission Management**: Flexible commission rates and payment tracking
- **Performance Metrics**: Track ratings, orders, and revenue analytics

### 🔒 Security & Verification
- **JWT Authentication**: Secure API access with role-based permissions
- **Agency Verification**: Multi-step verification process with document validation
- **Business Registration**: Integration with business registration requirements
- **Insurance Validation**: Proof of insurance and bonding verification

### 📊 Service Categories
- **Delivery Services**: Package delivery, food delivery, courier services
- **Emergency Services**: 24/7 emergency response and assistance
- **Maintenance Services**: Property maintenance, repairs, and upkeep
- **Insurance Services**: Insurance claims, assessments, and processing
- **Cleaning Services**: Residential and commercial cleaning
- **Security Services**: Security guards, surveillance, and protection
- **Transportation**: Vehicle services, logistics, and transport
- **Legal Services**: Legal consultation and document processing
- **Financial Services**: Financial planning and advisory
- **Marketing Services**: Digital marketing and advertising
- **Consulting**: Business and technical consulting
- **Other**: Custom service categories

### 🎯 Commission System
- **Flexible Rates**: Configurable commission rates per agency (5-30%)
- **Service-Specific Pricing**: Different rates for different service types
- **Performance-Based**: Commission adjustments based on performance metrics
- **Automated Calculations**: Real-time commission calculation and tracking

## 🛠️ Installation

### Prerequisites
- Node.js 18+ or Bun runtime
- PostgreSQL database
- JWT secret for authentication

### Setup
```bash
# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate database schema
bun run db:generate

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## ⚙️ Environment Variables

#### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/marketplace_agencies
```

#### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-for-agencies
JWT_EXPIRES_IN=24h
```

#### Commission Settings
```env
DEFAULT_COMMISSION_RATE=0.15
MIN_COMMISSION_RATE=0.05
MAX_COMMISSION_RATE=0.30
```

#### External Services
```env
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002
BOOKING_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
```

## 📡 API Endpoints

### Agency Management
```
POST   /api/agencies              # Create new agency
GET    /api/agencies/search       # Search agencies with filters
GET    /api/agencies/:id          # Get agency by ID
PUT    /api/agencies/:id          # Update agency
DELETE /api/agencies/:id          # Delete agency
GET    /api/agencies/me/agency    # Get current user's agency
```

### Agency Verification (Admin Only)
```
POST   /api/agencies/:id/verify   # Verify agency
POST   /api/agencies/:id/reject   # Reject agency verification
```

### Statistics and Analytics
```
GET    /api/agencies/:id/stats    # Get agency statistics
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Test Coverage
- **Agency Service Logic**: Business rules and validations
- **Commission Calculations**: Rate calculations and payment processing
- **Location Services**: Coverage area and distance calculations
- **Performance Metrics**: Rating calculations and analytics
- **Security**: Authentication, authorization, and data validation

## 💼 Agency Registration Flow

### 1. Agency Creation
```typescript
POST /api/agencies
{
  "name": "Bangkok Delivery Services",
  "description": "Professional delivery services across Bangkok",
  "email": "contact@bangkokdelivery.com",
  "phone": "+66123456789",
  "primaryLocation": {
    "address": "123 Sukhumvit Road",
    "city": "Bangkok",
    "region": "Bangkok",
    "country": "TH",
    "coordinates": {
      "latitude": 13.7563,
      "longitude": 100.5018
    }
  },
  "coverageAreas": [...],
  "commissionRate": 0.15
}
```

### 2. Service Configuration
```typescript
POST /api/agency-services
{
  "agencyId": "agency-uuid",
  "name": "Express Delivery",
  "description": "Same-day delivery service",
  "category": "delivery",
  "basePrice": 150,
  "pricingModel": "fixed",
  "requirements": ["vehicle", "license"],
  "capabilities": ["same_day", "fragile_items"]
}
```

### 3. Verification Process
```typescript
POST /api/agencies/:id/verify
{
  "verificationNotes": "All documents verified successfully"
}
```

## 📊 Commission Management

### Commission Calculation
```typescript
const commissionAmount = servicePrice * commissionRate;
const agencyEarnings = servicePrice - commissionAmount;
```

### Performance Metrics
- **Completion Rate**: Completed orders / Total orders
- **Average Rating**: Sum of ratings / Number of reviews
- **Response Time**: Average time to accept bookings
- **Revenue Tracking**: Total earnings and commission payments

## 🔍 Search and Filtering

### Agency Search
```typescript
GET /api/agencies/search?status=active&category=delivery&minRating=4.0&location=Bangkok
```

### Available Filters
- **Status**: pending, active, suspended, inactive, rejected
- **Verification**: pending, verified, rejected, expired
- **Category**: delivery, emergency, maintenance, etc.
- **Rating Range**: minimum and maximum ratings
- **Commission Range**: commission rate filtering
- **Location**: city, region, country with radius
- **Search**: text search in name and description

## 🏗️ Database Schema

### Tables
- **agencies**: Core agency information and settings
- **agency_services**: Service offerings and pricing
- **service_assignments**: Assignment of services to listings/bookings
- **commission_payments**: Commission payment tracking

### Key Relationships
- Agency → Agency Services (1:many)
- Agency → Service Assignments (1:many)
- Service Assignment → Commission Payments (1:many)

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Role-based access control (user, admin, agency_owner, agency_manager)
- Agency ownership verification

### Authorization Levels
- **Public**: Agency search and viewing
- **Authenticated**: Agency creation and management
- **Agency Owner**: Own agency management
- **Admin**: All agency operations and verification

## 📈 Monitoring

### Health Checks
- Database connectivity
- Service dependencies
- Performance metrics

### Metrics
- Agency registration rates
- Verification success rates
- Commission payment processing
- Service assignment completion rates

## 🚨 Error Handling

### Common Error Codes
- `AGENCY_NOT_FOUND`: Agency does not exist
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `COMMISSION_RATE_INVALID`: Commission rate outside allowed range

## 📞 Support

For technical support or questions:
- Check the API documentation at `/api`
- Review the test cases for usage examples
- Contact the development team

---

**Agency Service v1.0.0** - Professional agency management for Thailand Marketplace
