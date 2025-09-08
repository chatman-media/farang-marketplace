# User Service

This service handles user management, authentication, and role-based access
control for the marketplace platform.

## Features

- User registration and profile management
- Role-based access control (User, Agency, Manager, Admin)
- Password hashing and validation
- User verification system
- **Multi-language support** (English, Russian, Thai, Chinese, Arabic)
- **International phone number validation**
- **Multi-channel notifications** (Email, SMS, Telegram, WhatsApp, LINE, Push)
- **User preferences management** (language, currency, timezone, notification channels)
- Comprehensive validation using Zod schemas
- Database migrations for PostgreSQL

## Architecture

- **UserEntity**: Core business logic and validation
- **UserRepository**: Database operations and queries
- **UserService**: High-level business operations
- **Database Migrations**: PostgreSQL schema management

## User Roles

- **USER**: Regular users who can create listings and make bookings
- **AGENCY**: Service providers who offer additional services
- **MANAGER**: Can moderate content and oversee AI agent interactions
- **ADMIN**: Full system access and user management

## Database Schema

The service uses PostgreSQL with the following main table:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  telegram_id VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  profile JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### Running Migrations

```bash
bun run migrate
```

### Running Tests

```bash
bun test
```

### Development

```bash
bun run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password

## API Integration

This service is designed to be used by the API Gateway and authentication
service. It provides:

- User CRUD operations
- Password validation for authentication
- Role-based permission checking
- User statistics and analytics

## Testing

The service includes comprehensive unit tests for:

- User entity business logic
- Password hashing and validation
- Role-based permissions
- Profile management
- Account status management
- Input validation

All tests use Vitest and achieve high code coverage for critical business logic.
