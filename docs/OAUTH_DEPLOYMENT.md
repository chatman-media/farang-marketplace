# OAuth System Deployment Guide

## Overview

This guide covers the deployment and configuration of the OAuth authentication system for the Thailand Marketplace platform.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- SSL certificates for production (required for OAuth)
- Domain name configured

## Environment Configuration

### Required Environment Variables

Copy the `.env.example` file and configure the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/thailand_marketplace
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thailand_marketplace
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# OAuth Provider Configuration
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# TikTok OAuth
TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# Telegram OAuth
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your-telegram-bot-username
```

## OAuth Provider Setup

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure authorized redirect URIs:
   - Development: `http://localhost:3001/api/oauth/google/callback`
   - Production: `https://api.yourdomain.com/api/oauth/google/callback`
6. Copy Client ID and Client Secret to environment variables

### 2. Apple OAuth Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with "Sign In with Apple" capability
3. Create a Services ID for web authentication
4. Configure return URLs:
   - Development: `http://localhost:3001/api/oauth/apple/callback`
   - Production: `https://api.yourdomain.com/api/oauth/apple/callback`
5. Create a private key for Sign In with Apple
6. Configure environment variables with Team ID, Key ID, and Private Key

### 3. TikTok OAuth Setup

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Enable "Login Kit" product
4. Configure redirect URIs:
   - Development: `http://localhost:3001/api/oauth/tiktok/callback`
   - Production: `https://api.yourdomain.com/api/oauth/tiktok/callback`
5. Copy App ID and App Secret to environment variables

### 4. Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot` command
3. Get the bot token
4. Set the domain for login widget:
   ```
   /setdomain
   @your_bot_name
   yourdomain.com
   ```
5. Configure bot token and username in environment variables

## Database Migration

Ensure your database schema supports OAuth by running migrations:

```bash
npm run migrate
```

The migration should include:
- `social_profiles` table for storing OAuth account links
- `primary_auth_provider` column in users table
- Indexes for performance optimization

## Deployment Steps

### 1. Build the Application

```bash
npm run build
```

### 2. Install Production Dependencies

```bash
npm ci --only=production
```

### 3. Run Database Migrations

```bash
NODE_ENV=production npm run migrate
```

### 4. Start the Service

```bash
NODE_ENV=production npm start
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  user-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/thailand_marketplace
    env_file:
      - .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: thailand_marketplace
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    location /api/oauth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Considerations

### 1. HTTPS Only

- OAuth flows MUST use HTTPS in production
- Configure SSL certificates properly
- Use HSTS headers

### 2. Environment Variables

- Never commit secrets to version control
- Use secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets regularly

### 3. CORS Configuration

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'https://yourdomain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 4. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit'

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many OAuth requests from this IP'
})

app.use('/api/oauth', oauthLimiter)
```

## Monitoring and Logging

### 1. Health Checks

The service includes a health check endpoint at `/health`:

```bash
curl https://api.yourdomain.com/health
```

### 2. Logging

Configure structured logging for OAuth events:

```javascript
const logger = {
  info: (message, meta) => console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() })),
  error: (message, meta) => console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() })),
  warn: (message, meta) => console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }))
}
```

### 3. Metrics

Monitor key OAuth metrics:
- Authentication success/failure rates
- Provider-specific conversion rates
- Response times
- Error rates by provider

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   - Ensure redirect URIs match exactly in provider configuration
   - Check for trailing slashes and protocol mismatches

2. **CORS Errors**
   - Verify CORS_ORIGIN environment variable
   - Check that frontend domain is whitelisted

3. **SSL Certificate Issues**
   - Ensure certificates are valid and not expired
   - Check certificate chain completeness

4. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check database server accessibility
   - Ensure migrations have been run

### Debug Mode

Enable debug logging:

```bash
DEBUG=oauth:* NODE_ENV=development npm start
```

## Testing in Production

### 1. OAuth Flow Testing

```bash
# Test provider availability
curl https://api.yourdomain.com/api/oauth/providers

# Test OAuth initialization
curl https://api.yourdomain.com/api/oauth/google/auth
```

### 2. Integration Testing

Run the test suite against production configuration:

```bash
NODE_ENV=test npm test
```

## Backup and Recovery

### Database Backup

```bash
# Backup user and OAuth data
pg_dump -h localhost -U postgres -d thailand_marketplace \
  --table=users --table=social_profiles \
  --data-only --inserts > oauth_backup.sql
```

### Recovery

```bash
# Restore from backup
psql -h localhost -U postgres -d thailand_marketplace < oauth_backup.sql
```

## Performance Optimization

### 1. Database Indexes

```sql
-- Index for social profile lookups
CREATE INDEX idx_social_profiles_provider_id ON social_profiles(provider, provider_id);

-- Index for user email lookups
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
```

### 2. Caching

Implement Redis caching for OAuth state and temporary data:

```javascript
const redis = require('redis')
const client = redis.createClient(process.env.REDIS_URL)

// Cache OAuth state
await client.setex(`oauth:state:${state}`, 600, JSON.stringify(stateData))
```

## Support and Maintenance

- Monitor OAuth provider status pages for service disruptions
- Keep OAuth libraries and dependencies updated
- Review and rotate secrets quarterly
- Monitor authentication metrics and user feedback
- Test OAuth flows after any infrastructure changes

For additional support, refer to the [OAuth API Documentation](./OAUTH_API.md) and [OAuth Implementation Guide](./OAUTH_IMPLEMENTATION.md).