# Payment Service

A comprehensive payment processing service with TON blockchain integration for
the Thailand Marketplace platform.

## 🚀 Features

### 💳 Payment Processing

- **TON Blockchain Integration**: Native support for TON wallet payments
- **Stripe Integration**: Credit cards, SEPA, iDEAL, SOFORT payments
- **Multi-Currency Support**: TON, USDT, USDC, USD, THB, EUR
- **Payment Methods**: TON Wallet, TON Connect, Jettons, Credit Cards, Bank
  Transfers
- **Real-time Confirmation**: Blockchain transaction monitoring
- **Automatic Status Updates**: Smart payment lifecycle management

### 🔒 Security & Compliance

- **JWT Authentication**: Secure API access with role-based permissions
- **Webhook Verification**: HMAC signature validation for external notifications
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Data Encryption**: Secure handling of sensitive payment information

### 📊 Advanced Features

- **Payment Search & Filtering**: Comprehensive query capabilities
- **Transaction History**: Complete audit trail for all payments
- **Refund Management**: Automated and manual refund processing
- **Dispute Resolution**: Built-in dispute handling system
- **Fee Calculation**: Dynamic platform and processing fees

## 🏗️ Architecture

### Database Schema

- **Payments**: Core payment records with blockchain integration
- **Transactions**: Detailed transaction history and blockchain data
- **Refunds**: Refund processing and tracking
- **Disputes**: Dispute management and resolution
- **Payment Methods**: User payment method management

### Services

- **PaymentService**: Core payment processing logic
- **TonService**: TON blockchain integration and wallet management
- **StripeService**: Stripe payment processing and webhook handling
- **WebhookController**: External payment notification handling

## 🛠️ Installation

### Prerequisites

- Node.js 18+ or Bun runtime
- PostgreSQL database
- TON wallet for blockchain operations

### Setup

```bash
# Install dependencies
bun install

# Copy environment configuration
cp .env.example .env

# Configure environment variables
# Edit .env with your settings

# Generate database schema
bun run db:generate

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## ⚙️ Configuration

### Environment Variables

#### Server Configuration

```env
PORT=3003
NODE_ENV=development
```

#### Database

```env
DATABASE_URL=postgresql://user:password@localhost:5432/marketplace_payments
```

#### TON Blockchain

```env
TON_NETWORK=testnet
TON_API_KEY=your-ton-api-key
TON_WALLET_MNEMONIC=your-wallet-mnemonic-phrase
TON_WALLET_ADDRESS=your-ton-wallet-address
```

#### Stripe Integration

```env
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
STRIPE_RETURN_URL=https://your-domain.com/payment/return
```

#### Security

```env
JWT_SECRET=your-super-secret-jwt-key
PAYMENT_WEBHOOK_SECRET=your-webhook-secret-key
```

## 📡 API Endpoints

### Payment Management

```
POST   /api/payments              # Create new payment
GET    /api/payments/search       # Search payments with filters
GET    /api/payments/:id          # Get payment by ID
PATCH  /api/payments/:id/status   # Update payment status
POST   /api/payments/:id/process-ton # Process TON payment
POST   /api/payments/:id/process-stripe # Process Stripe payment
POST   /api/payments/:id/confirm-stripe # Confirm Stripe payment
GET    /api/payments/:id/transactions # Get payment transaction history
```

### Webhooks

```
POST   /api/webhooks/ton          # TON blockchain webhooks
POST   /api/webhooks/stripe       # Stripe payment webhooks
POST   /api/webhooks/payment      # Generic payment webhooks
POST   /api/webhooks/refund       # Refund processing webhooks
GET    /api/webhooks/health       # Webhook health check
```

### System

```
GET    /health                    # Service health check
GET    /api                       # API documentation
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test PaymentService.test.ts
```

### Test Coverage

- **Payment Service Logic**: Business rules and validations
- **TON Service Integration**: Blockchain operations and conversions
- **API Endpoints**: Request/response validation and error handling
- **Security**: Authentication, authorization, and webhook verification

## 💰 Payment Flow

### 1. Payment Creation

```typescript
POST /api/payments
{
  "bookingId": "uuid",
  "payeeId": "uuid",
  "amount": "100.50000000",
  "currency": "TON",
  "paymentMethod": "ton_wallet",
  "tonWalletAddress": "EQ..."
}
```

### 2. TON Payment Processing

```typescript
POST /api/payments/:id/process-ton
{
  "fromAddress": "EQ...",
  "transactionHash": "abc123..."
}
```

### 3. Webhook Confirmation

```typescript
POST /api/webhooks/ton
{
  "event_type": "transaction_confirmed",
  "transaction": {
    "hash": "abc123...",
    "confirmations": 3
  }
}
```

## 🔧 Development

### Project Structure

```
src/
├── controllers/     # API request handlers
├── services/        # Business logic services
├── db/             # Database schema and connection
├── middleware/     # Authentication and validation
├── routes/         # API route definitions
├── test/           # Test files
└── index.ts        # Application entry point
```

### Code Quality

- **TypeScript**: Full type safety with strict mode
- **ESLint**: Code linting and formatting
- **Vitest**: Modern testing framework
- **Drizzle ORM**: Type-safe database operations

## 🚀 Deployment

### Production Build

```bash
# Build TypeScript
bun run build

# Start production server
bun start
```

### Docker Support

```dockerfile
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3003
CMD ["bun", "start"]
```

## 📈 Monitoring

### Health Checks

- Database connectivity
- TON network status
- Service dependencies

### Metrics

- Payment success rates
- Transaction confirmation times
- API response times
- Error rates by endpoint

## 🔐 Security

### Best Practices

- JWT token validation on all protected endpoints
- HMAC signature verification for webhooks
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure environment variable management

### TON Security

- Wallet mnemonic encryption
- Transaction signing verification
- Address validation
- Confirmation requirements based on amount

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api`

---

**Payment Service v1.0.0** - Secure, scalable payment processing with TON
blockchain integration
