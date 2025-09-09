# OAuth Providers Setup Guide

This guide explains how to configure each OAuth provider for the Thailand
Marketplace platform.

## Prerequisites

1. Copy the environment variables from `.env.example` to your `.env` file
2. Configure each provider you want to use by following the sections below
3. Restart the user-service after updating environment variables

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2. Configure OAuth Consent Screen

1. Go to APIs & Services > OAuth consent screen
2. Choose "External" user type
3. Fill in required fields:
   - App name: "Thailand Marketplace"
   - User support email: your email
   - Developer contact information: your email

### 3. Create OAuth Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3001/api/oauth/google/callback` (development)
   - `https://yourdomain.com/api/oauth/google/callback` (production)

### 4. Environment Variables

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback
```

## Apple Sign In Setup

### 1. Apple Developer Account

1. You need an Apple Developer account ($99/year)
2. Go to [Apple Developer Portal](https://developer.apple.com/)

### 2. Create App ID

1. Go to Certificates, Identifiers & Profiles
2. Create a new App ID with Sign In with Apple capability

### 3. Create Service ID

1. Create a new Services ID
2. Configure Sign In with Apple
3. Add your domain and redirect URLs

### 4. Create Private Key

1. Go to Keys section
2. Create a new key with Sign In with Apple capability
3. Download the .p8 file and note the Key ID

### 5. Environment Variables

```env
APPLE_CLIENT_ID=com.yourapp.service-id
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_YOUR_KEY_ID.p8
APPLE_CALLBACK_URL=http://localhost:3001/api/oauth/apple/callback
```

## TikTok Login Kit Setup

### 1. TikTok for Developers

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a developer account
3. Create a new app

### 2. Configure Login Kit

1. Enable Login Kit for your app
2. Add redirect URIs
3. Request necessary scopes: `user.info.basic`

### 3. Environment Variables

```env
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_CALLBACK_URL=http://localhost:3001/api/oauth/tiktok/callback
```

## Telegram Login Widget Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command to create a new bot
3. Get your bot token and username

### 2. Configure Domain

1. Use `/setdomain` command with @BotFather
2. Set your domain (e.g., `localhost:3000` for development)

### 3. Environment Variables

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
```

## LINE Login Setup

### 1. LINE Developers Console

1. Go to [LINE Developers](https://developers.line.biz/)
2. Create a new provider and channel
3. Choose "LINE Login" channel type

### 2. Configure Channel

1. Set channel name and description
2. Add redirect URIs
3. Configure scopes: `profile`, `openid`, `email`

### 3. Environment Variables

```env
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CALLBACK_URL=http://localhost:3001/api/oauth/line/callback
```

## WhatsApp Business API Setup

### 1. Meta for Developers

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add WhatsApp Business API product

### 2. Configure WhatsApp

1. Set up a business phone number
2. Configure webhook URLs
3. Get necessary permissions

### 3. Environment Variables

```env
WHATSAPP_APP_ID=your-whatsapp-app-id
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_CALLBACK_URL=http://localhost:3001/api/oauth/whatsapp/callback
```

## Testing OAuth Flows

### 1. Check Available Providers

```bash
curl http://localhost:3001/api/oauth/providers
```

### 2. Test OAuth Flow

```bash
# Initialize OAuth
curl "http://localhost:3001/api/oauth/google/auth"

# Visit the returned authUrl in browser
# Complete authorization
# Use the returned code in callback

curl -X POST "http://localhost:3001/api/oauth/google/callback" \
  -H "Content-Type: application/json" \
  -d '{"code": "authorization_code", "state": "state_value"}'
```

## Production Considerations

1. **HTTPS Only**: All OAuth flows must use HTTPS in production
2. **Domain Verification**: Register your production domains with each provider
3. **Rate Limiting**: Implement rate limiting on OAuth endpoints
4. **Error Handling**: Provide user-friendly error messages
5. **Security**: Validate all OAuth responses and implement CSRF protection

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**: Ensure URIs match exactly in provider settings
2. **Scope errors**: Check that requested scopes are approved for your app
3. **Token expiration**: Implement proper token refresh logic
4. **CORS errors**: Configure CORS settings for your frontend domain

### Debug Mode

Set `NODE_ENV=development` to see detailed OAuth error messages in logs.
