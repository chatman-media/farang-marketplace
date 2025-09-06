# OAuth API Documentation

## Overview

This document describes the OAuth authentication API endpoints for the Thailand Marketplace platform. The OAuth system supports multiple authentication providers including Google, Apple, TikTok, and Telegram.

## Base URL

```
http://localhost:3001/api/oauth
```

## Authentication

Some endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Get Available Providers

**GET** `/providers`

Returns a list of configured OAuth providers.

#### Response

```json
{
  "providers": [
    {
      "name": "google",
      "displayName": "Google",
      "configured": true
    },
    {
      "name": "telegram",
      "displayName": "Telegram",
      "configured": true
    },
    {
      "name": "apple",
      "displayName": "Apple",
      "configured": false
    }
  ]
}
```

### 2. Initialize OAuth Flow

**GET** `/:provider/auth`

Initiates the OAuth authentication flow for the specified provider.

#### Parameters

- `provider` (path): The OAuth provider name (google, apple, tiktok)
- `redirect_uri` (query, optional): Custom redirect URI after authentication

#### Response

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "random_state_string"
}
```

#### Example

```bash
curl "http://localhost:3001/api/oauth/google/auth?redirect_uri=http://localhost:3000/auth/callback"
```

### 3. Handle OAuth Callback

**POST** `/:provider/callback`

Handles the OAuth callback and completes the authentication process.

#### Parameters

- `provider` (path): The OAuth provider name

#### Request Body

**For Google/Apple/TikTok:**
```json
{
  "code": "authorization_code_from_provider",
  "state": "state_from_auth_request"
}
```

**For Telegram:**
```json
{
  "telegramData": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/...",
    "auth_date": 1640995200,
    "hash": "telegram_hash"
  }
}
```

#### Response

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "socialProfiles": [
      {
        "provider": "google",
        "providerId": "google_user_id",
        "email": "user@example.com",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg",
        "connectedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "primaryAuthProvider": "google",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 4. Link Social Account

**POST** `/:provider/link`

🔒 **Requires Authentication**

Links a social account to the authenticated user's profile.

#### Parameters

- `provider` (path): The OAuth provider name

#### Request Body

Same as OAuth callback request body.

#### Response

```json
{
  "message": "Social account linked successfully",
  "socialProfile": {
    "provider": "google",
    "providerId": "google_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Unlink Social Account

**DELETE** `/:provider/unlink`

🔒 **Requires Authentication**

Unlinks a social account from the authenticated user's profile.

#### Parameters

- `provider` (path): The OAuth provider name

#### Response

```json
{
  "message": "Social account unlinked successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": "Specific error details"
  }
}
```

### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "message": "OAuth provider not found or not configured"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "ACCOUNT_ALREADY_LINKED",
    "message": "This social account is already linked to another user"
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Provider-Specific Notes

### Google OAuth

- Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
- Scopes: `profile email`
- Redirect URI must be registered in Google Console

### Apple OAuth

- Requires `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY` environment variables
- Uses Apple's Sign in with Apple service
- Supports both web and mobile flows

### TikTok OAuth

- Requires `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET` environment variables
- Scopes: `user.info.basic`
- Limited to approved applications

### Telegram Login Widget

- Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` environment variables
- Uses Telegram Login Widget instead of traditional OAuth flow
- No authorization URL - uses widget integration

## Security Considerations

1. **State Parameter**: Always validate the state parameter to prevent CSRF attacks
2. **HTTPS Only**: OAuth flows should only be used over HTTPS in production
3. **Token Storage**: Store access tokens securely and implement proper token rotation
4. **Scope Limitation**: Request only necessary scopes from OAuth providers
5. **Rate Limiting**: Implement rate limiting on OAuth endpoints
6. **Input Validation**: Validate all input parameters and OAuth responses

## Testing

For testing OAuth flows in development:

1. Set up test applications with each OAuth provider
2. Configure environment variables with test credentials
3. Use ngrok or similar tools to expose localhost for OAuth callbacks
4. Test both successful and error scenarios

## Examples

### Complete OAuth Flow (Google)

1. **Initialize OAuth:**
   ```bash
   curl "http://localhost:3001/api/oauth/google/auth"
   ```

2. **User visits returned authUrl and authorizes**

3. **Handle callback:**
   ```bash
   curl -X POST "http://localhost:3001/api/oauth/google/callback" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "authorization_code_from_google",
       "state": "state_from_step_1"
     }'
   ```

### Link Additional Account

```bash
curl -X POST "http://localhost:3001/api/oauth/telegram/link" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "telegramData": {
      "id": 123456789,
      "first_name": "John",
      "hash": "telegram_hash"
    }
  }'
```