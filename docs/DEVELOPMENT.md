# Development Guide

## Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Docker](https://docker.com) and Docker Compose
- [Node.js](https://nodejs.org) >= 18 (for compatibility)

## Quick Start

1. **Clone and setup the project:**

   ```bash
   git clone <repository-url>
   cd marketplace-rental-platform
   ./scripts/setup-dev.sh
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development:**
   ```bash
   bun run dev
   ```

## Project Structure

```
marketplace-rental-platform/
├── apps/                    # Frontend applications
│   ├── web/                # Main web application
│   ├── admin/              # Admin panel
│   └── ton-app/            # TON Mini App
├── services/               # Backend microservices
│   └── user-service/       # User management service
├── packages/               # Shared packages
│   └── shared-types/       # TypeScript type definitions
├── docker/                 # Docker configuration
├── scripts/                # Development scripts
└── docs/                   # Documentation
```

## Available Scripts

### Root Level Commands

- `bun run dev` - Start all services in development mode
- `bun run build` - Build all packages and applications
- `bun run test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- `bun run lint` - Lint all code
- `bun run lint:fix` - Fix linting issues
- `bun run format` - Format code with Prettier
- `bun run type-check` - Run TypeScript type checking

### Docker Commands

- `bun run docker:up` - Start Docker services
- `bun run docker:down` - Stop Docker services
- `bun run docker:logs` - View Docker logs
- `bun run docker:reset` - Reset Docker environment (removes volumes)

## Development Services

### Database Services

- **PostgreSQL**: `localhost:5432`
  - Database: `marketplace`
  - User: `marketplace_user`
  - Password: `marketplace_pass`

- **Redis**: `localhost:6379`
  - No authentication in development

- **MinIO**: `localhost:9000` (API), `localhost:9001` (Console)
  - Access Key: `minioadmin`
  - Secret Key: `minioadmin123`

### Development Tools

- **MailHog**: `http://localhost:8025`
  - SMTP server for email testing
  - Web interface to view sent emails

- **PgAdmin**: `http://localhost:5050` (optional, use `--profile tools`)
  - Email: `admin@marketplace.local`
  - Password: `admin123`

## Architecture Overview

### Monorepo Structure

This project uses Turbo for monorepo management with the following workspace
structure:

- **Apps**: Frontend applications built with Vite + React
- **Services**: Backend microservices built with Node.js/TypeScript
- **Packages**: Shared libraries and type definitions

### Technology Stack

**Frontend:**

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management

**Backend:**

- Node.js with TypeScript
- Express/Fastify for APIs
- PostgreSQL for primary database
- Redis for caching and sessions
- MinIO for file storage

**Development:**

- Turbo for monorepo management
- Docker for local development environment
- ESLint + Prettier for code quality
- Vitest for testing

## Shared Types Package

The `@marketplace/shared-types` package contains all TypeScript interfaces and
types used across the platform:

- **User Types**: User profiles, authentication, roles
- **Listing Types**: Product/service listings, categories
- **Booking Types**: Reservations, transactions
- **CRM Types**: Customer management, communications, campaigns
- **AI Types**: Conversation management, AI service interfaces
- **Payment Types**: Transaction processing, TON integration

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace

# Redis
REDIS_URL=redis://localhost:6379

# MinIO/S3
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# External APIs
OPENAI_API_KEY=your-openai-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### Service-Specific Configuration

Each service may have additional environment variables. Check the `.env.example`
file in each service directory.

## Development Workflow

### Adding New Features

1. **Create feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Update shared types if needed:**

   ```bash
   cd packages/shared-types
   # Add new types
   bun run build
   ```

3. **Implement in services/apps:**

   ```bash
   cd services/your-service
   # Implement feature
   bun run test
   ```

4. **Test integration:**
   ```bash
   bun run test
   bun run lint
   bun run type-check
   ```

### Database Migrations

Database schema changes should be made in:

- `docker/postgres/init.sql` for initial schema
- Service-specific migration files for incremental changes

### Code Quality

The project enforces code quality through:

- **ESLint**: Linting rules for TypeScript/JavaScript
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Vitest**: Unit and integration testing

Run quality checks:

```bash
bun run lint
bun run format:check
bun run type-check
bun run test
```

## Troubleshooting

### Common Issues

1. **Docker services not starting:**

   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Port conflicts:**
   - Check if ports 5432, 6379, 9000, 9001 are available
   - Modify docker-compose.yml if needed

3. **Build failures:**

   ```bash
   bun run clean
   bun install
   bun run build
   ```

4. **Type errors after updating shared-types:**
   ```bash
   cd packages/shared-types
   bun run build
   cd ../..
   bun run type-check
   ```

### Getting Help

- Check the logs: `bun run docker:logs`
- Verify service health: `docker-compose ps`
- Reset environment: `bun run docker:reset`

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Ensure all checks pass before submitting PR

## Next Steps

After setting up the development environment:

1. Explore the codebase structure
2. Run the test suite to understand the current functionality
3. Check the project roadmap in the main README
4. Start implementing features according to the task list
