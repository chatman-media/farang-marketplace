# CRM Service

A comprehensive Customer Relationship Management (CRM) service for the Thailand Marketplace platform. This service handles customer data management, lead tracking, and provides analytics for sales and marketing teams.

## 🎯 Features

### Customer Management
- **Customer Profiles**: Complete customer information with contact details
- **Multi-channel Communication**: Support for Email, Telegram, WhatsApp, SMS, Phone
- **Lead Scoring**: Automated scoring based on customer behavior and lead quality
- **Custom Fields**: Flexible custom data storage for business-specific needs
- **Tagging System**: Organize customers with custom tags

### Lead Management
- **Lead Lifecycle**: Track leads from initial contact to conversion
- **Priority Management**: Assign priority levels (Low, Medium, High, Urgent)
- **Assignment System**: Assign leads to team members
- **Follow-up Tracking**: Schedule and track follow-up activities
- **Source Tracking**: Track lead sources (Website, Telegram, WhatsApp, etc.)

### Analytics & Reporting
- **Conversion Metrics**: Track lead-to-customer conversion rates
- **Performance Analytics**: Monitor team and individual performance
- **Communication Stats**: Track message delivery and response rates
- **Lead Scoring Analytics**: Analyze lead quality and scoring effectiveness

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify 5.x
- **Database**: PostgreSQL with custom query builder
- **Authentication**: JWT-based authentication
- **Validation**: Fastify JSON Schema validation
- **Testing**: Vitest with comprehensive test coverage
- **Security**: Helmet, CORS, rate limiting

## 📊 Database Schema

### Core Tables
- **customers**: Customer profiles and contact information
- **leads**: Lead tracking and management
- **communication_history**: Multi-channel communication logs
- **message_templates**: Reusable message templates
- **campaigns**: Marketing campaign management
- **campaign_messages**: Campaign message configurations
- **automations**: Automated workflow definitions

### Key Features
- **UUID Primary Keys**: Secure and scalable identifiers
- **JSONB Fields**: Flexible data storage for custom fields and metadata
- **Indexes**: Optimized for common query patterns
- **Triggers**: Automatic timestamp updates

## 🚀 API Endpoints

### Customer Endpoints
```
POST   /api/crm/customers          # Create customer
GET    /api/crm/customers          # List customers (with filters)
GET    /api/crm/customers/:id      # Get customer by ID
PUT    /api/crm/customers/:id      # Update customer
DELETE /api/crm/customers/:id      # Delete customer (admin only)
```

### Lead Endpoints
```
POST   /api/crm/leads              # Create lead
GET    /api/crm/leads              # List leads (with filters)
GET    /api/crm/leads/:id          # Get lead by ID
PUT    /api/crm/leads/:id          # Update lead
DELETE /api/crm/leads/:id          # Delete lead (admin/manager only)
```

### Analytics Endpoints
```
GET    /api/crm/analytics          # Get CRM analytics (admin/manager only)
```

### Health Check
```
GET    /api/crm/health             # Service health check
```

## 🔧 Configuration

### Environment Variables
```bash
# Server
PORT=3007
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketplace
DB_USER=marketplace_user
DB_PASSWORD=marketplace_pass

# Authentication
JWT_SECRET=your-secret-key

# CORS
CORS_ORIGIN=*
```

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ or Bun runtime
- PostgreSQL database
- Redis (for future caching features)

### Installation
```bash
# Install dependencies
bun install

# Run database migrations
bun run migrate

# Start development server
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

### Database Setup
```bash
# Run migrations to create tables
bun run migrate

# The migration will create all necessary tables and indexes
```

## 📝 Usage Examples

### Create a Customer
```typescript
const customer = await crmService.createCustomer({
  email: "customer@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  preferredChannel: CommunicationChannel.EMAIL,
  tags: ["vip", "interested"],
  customFields: {
    source: "website",
    budget: 10000
  }
})
```

### Create a Lead
```typescript
const lead = await crmService.createLead({
  customerId: "customer-uuid",
  source: LeadSource.WEBSITE,
  priority: LeadPriority.HIGH,
  value: 5000,
  notes: "Interested in premium package",
  followUpDate: new Date("2024-01-15")
})
```

### Update Lead Status
```typescript
const updatedLead = await crmService.updateLead("lead-uuid", {
  status: LeadStatus.QUALIFIED,
  assignedTo: "sales-rep-uuid",
  notes: "Customer confirmed interest"
})
```

## 🧪 Testing

The service includes comprehensive tests covering:

- **Unit Tests**: Model validation and business logic
- **Service Tests**: CRM service functionality with mocked database
- **Integration Tests**: End-to-end API testing
- **Validation Tests**: Request validation and error handling

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run with coverage
bun test --coverage
```

## 🔒 Security Features

- **JWT Authentication**: Secure API access
- **Role-based Access Control**: Different permissions for admin, manager, user
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests

## 📈 Performance Features

- **Database Indexes**: Optimized query performance
- **Pagination**: Efficient data retrieval for large datasets
- **Connection Pooling**: Efficient database connection management
- **Caching Ready**: Prepared for Redis integration
- **Async Operations**: Non-blocking I/O operations

## 🔮 Future Enhancements

- **Campaign Management**: Automated marketing campaigns
- **Email Integration**: SMTP and template system
- **Telegram Bot**: Automated customer communication
- **WhatsApp Integration**: Business API integration
- **Advanced Analytics**: Machine learning insights
- **Workflow Automation**: Custom automation rules
- **Real-time Notifications**: WebSocket-based updates

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Ensure all checks pass before submitting PR

## 📄 License

This project is part of the Thailand Marketplace platform and follows the same licensing terms.
