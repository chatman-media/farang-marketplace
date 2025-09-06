# Authentication Documentation

Authentication system documentation for Thailand Marketplace.

## Overview

The authentication system supports multiple login methods:

- ✅ **Email/Password** - traditional registration
- ✅ **Google OAuth 2.0** - login via Google account
- ✅ **Apple Sign In** - login via Apple ID
- ✅ **TikTok Login Kit** - login via TikTok
- ✅ **Telegram Login Widget** - login via Telegram
- ✅ **LINE Login** - login via LINE
- ✅ **WhatsApp Business API** - login via WhatsApp

## Documents

### 📋 [oauth-api.md](../../auth/oauth-api.md)
Main document describing all OAuth providers:
- API endpoints for each provider
- Request and response examples
- Error handling
- Security and validation

### 🔧 [oauth-setup-guide.md](../../auth/oauth-setup-guide.md)
Technical setup guide:
- Step-by-step setup for each provider
- Configuration in developer consoles
- Environment variables
- Troubleshooting and debugging

## Current Status

### ✅ Completed
- Basic email/password authentication
- JWT tokens (access + refresh)
- User roles
- All OAuth providers implemented
- Complete documentation
- 176 tests passing successfully

### 🔄 In Development
- Frontend components
- Mobile applications

### 📋 Planned
- Two-factor authentication (2FA)
- Biometric authentication
- SSO for corporate clients

## Quick Start

### 1. Environment Variables Setup
```bash
# Copy .env.example to .env
cp .env.example .env

# Add OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_service_id
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
LINE_CHANNEL_ID=your_line_channel_id
WHATSAPP_APP_ID=your_whatsapp_app_id
# ... other providers
```

### 2. Install Dependencies
```bash
# Install dependencies
bun install
```

### 3. Start Service
```bash
# Start user-service
bun run dev
```

### 4. Testing
```bash
# Run tests
bun run test
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   User Service   │    │   OAuth         │
│                 │    │                  │    │   Providers     │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ OAuthButtons│ │◄──►│ │ OAuthService │ │◄──►│ Google, Apple,  │
│ └─────────────┘ │    │ └──────────────┘ │    │ TikTok, etc.    │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    └─────────────────┘
│ │ AuthContext │ │◄──►│ │ UserService  │ │
│ └─────────────┘ │    │ └──────────────┘ │
└─────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │    users    │ │
                       │ └─────────────┘ │
                       │ ┌─────────────┐ │
                       │ │social_      │ │
                       │ │profiles     │ │
                       │ └─────────────┘ │
                       └─────────────────┘
```

## Security

### Core Principles
- **State Parameter** - CSRF attack protection
- **PKCE** - for mobile applications
- **Token Rotation** - regular refresh token renewal
- **Rate Limiting** - login attempt restrictions
- **Signature Validation** - signature verification (Telegram)

### Validations
- Validation of all OAuth callbacks
- Token expiration checks
- Audit of all authentication attempts
- Suspicious activity monitoring

## Supported Providers

| Provider | Status | Features |
|----------|--------|----------|
| Google | ✅ | OAuth 2.0, profile + email |
| Apple | ✅ | Sign in with Apple, JWT |
| TikTok | ✅ | Login Kit, basic info |
| Telegram | ✅ | Login Widget, hash validation |
| LINE | ✅ | Popular in Asia |
| WhatsApp | ✅ | Business API |
| Email | ✅ | Traditional registration |

## API Endpoints

### Main Endpoints
- `GET /api/oauth/providers` - list available providers
- `GET /api/oauth/:provider/auth` - initiate OAuth
- `POST /api/oauth/:provider/callback` - handle callback
- `POST /api/oauth/:provider/link` - link account
- `DELETE /api/oauth/:provider/unlink` - unlink account

### Email Authentication
- `POST /api/auth/register` - registration
- `POST /api/auth/login` - login
- `POST /api/auth/refresh` - token refresh
- `POST /api/auth/logout` - logout

## Support

For authentication questions:
- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #auth-support
- 📖 Wiki: [Authentication Wiki](https://wiki.thailand-marketplace.com/auth)

## Changelog

### v1.1.0 (Current)
- Added all OAuth providers
- Complete implementation of WhatsApp, Apple, TikTok
- Enhanced security
- Complete documentation

### v1.0.0
- Basic email/password authentication
- JWT tokens
- User roles
- Telegram ID support
