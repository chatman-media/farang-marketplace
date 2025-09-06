# OAuth API 文档

## 概述

本文档描述了泰国市场平台的OAuth身份验证API端点。OAuth系统支持多种身份验证提供商，包括Google、Apple、TikTok、Telegram、LINE、WhatsApp和传统的邮箱/密码身份验证。

## 基础URL

```
http://localhost:3001/api/oauth
```

## 身份验证

某些端点需要在Authorization头中使用Bearer令牌进行身份验证：

```
Authorization: Bearer <access_token>
```

## 端点

### 1. 获取可用提供商

**GET** `/providers`

返回已配置的OAuth提供商列表。

#### 响应

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

### 2. 初始化OAuth流程

**GET** `/:provider/auth`

为指定提供商启动OAuth身份验证流程。

#### 参数

- `provider` (路径): OAuth提供商名称 (google, apple, tiktok, line, whatsapp)
- `redirect_uri` (查询, 可选): 身份验证后的自定义重定向URI

#### 响应

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "random_state_string"
}
```

#### 示例

```bash
curl "http://localhost:3001/api/oauth/google/auth?redirect_uri=http://localhost:3000/auth/callback"
```

### 3. 处理OAuth回调

**POST** `/:provider/callback`

处理OAuth回调并完成身份验证过程。

#### 参数

- `provider` (路径): OAuth提供商名称

#### 请求体

**对于Google/Apple/TikTok/LINE/WhatsApp:**
```json
{
  "code": "authorization_code_from_provider",
  "state": "state_from_auth_request"
}
```

**对于Telegram:**
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

#### 响应

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

### 4. 链接社交账户

**POST** `/:provider/link`

🔒 **需要身份验证**

将社交账户链接到已验证用户的个人资料。

#### 参数

- `provider` (路径): OAuth提供商名称

#### 请求体

与OAuth回调请求体相同。

#### 响应

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

### 5. 取消链接社交账户

**DELETE** `/:provider/unlink`

🔒 **需要身份验证**

从已验证用户的个人资料中取消链接社交账户。

#### 参数

- `provider` (路径): OAuth提供商名称

#### 响应

```json
{
  "message": "Social account unlinked successfully"
}
```

## 错误响应

所有端点可能返回以下错误响应：

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

## 提供商特定说明

### Google OAuth

- 需要 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 环境变量
- 作用域: `profile email`
- 重定向URI必须在Google控制台中注册

### Apple OAuth

- 需要 `APPLE_CLIENT_ID`、`APPLE_TEAM_ID`、`APPLE_KEY_ID` 和 `APPLE_PRIVATE_KEY` 环境变量
- 使用Apple的Sign in with Apple服务
- 支持网页和移动端流程

### TikTok OAuth

- 需要 `TIKTOK_CLIENT_ID` 和 `TIKTOK_CLIENT_SECRET` 环境变量
- 作用域: `user.info.basic`
- 仅限已批准的应用程序

### Telegram登录小部件

- 需要 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_BOT_USERNAME` 环境变量
- 使用Telegram登录小部件而不是传统的OAuth流程
- 没有授权URL - 使用小部件集成

### LINE登录

- 需要 `LINE_CHANNEL_ID` 和 `LINE_CHANNEL_SECRET` 环境变量
- 作用域: `profile openid email`
- 在泰国和其他亚洲市场很受欢迎
- 重定向URI必须在LINE开发者控制台中注册

### WhatsApp商业API

- 需要 `WHATSAPP_APP_ID`、`WHATSAPP_APP_SECRET` 和 `WHATSAPP_PHONE_NUMBER_ID` 环境变量
- 使用WhatsApp商业API进行身份验证
- 需要电话号码验证
- 仅限已批准的商业账户

### 邮箱/密码身份验证

- 传统的邮箱和密码身份验证
- 始终可用（无需外部配置）
- 包括注册、登录、密码重置功能
- 使用JWT令牌进行会话管理
- 可在 `/api/auth/register`、`/api/auth/login`、`/api/auth/refresh` 访问

## 安全考虑

1. **状态参数**: 始终验证状态参数以防止CSRF攻击
2. **仅HTTPS**: OAuth流程在生产环境中应仅通过HTTPS使用
3. **令牌存储**: 安全存储访问令牌并实施适当的令牌轮换
4. **作用域限制**: 仅从OAuth提供商请求必要的作用域
5. **速率限制**: 在OAuth端点上实施速率限制
6. **输入验证**: 验证所有输入参数和OAuth响应

## 测试

在开发中测试OAuth流程：

1. 为每个OAuth提供商设置测试应用程序
2. 使用测试凭据配置环境变量
3. 使用ngrok或类似工具为OAuth回调暴露localhost
4. 测试成功和错误场景

## 示例

### 完整的OAuth流程（Google）

1. **初始化OAuth:**
   ```bash
   curl "http://localhost:3001/api/oauth/google/auth"
   ```

2. **用户访问返回的authUrl并授权**

3. **处理回调:**
   ```bash
   curl -X POST "http://localhost:3001/api/oauth/google/callback" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "authorization_code_from_google",
       "state": "state_from_step_1"
     }'
   ```

### 链接额外账户

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

### LINE登录流程

1. **初始化LINE OAuth:**
   ```bash
   curl "http://localhost:3001/api/oauth/line/auth"
   ```

2. **处理LINE回调:**
   ```bash
   curl -X POST "http://localhost:3001/api/oauth/line/callback" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "authorization_code_from_line",
       "state": "state_from_step_1"
     }'
   ```

### WhatsApp商业身份验证

```bash
curl -X POST "http://localhost:3001/api/oauth/whatsapp/callback" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_whatsapp",
    "state": "state_from_auth_request"
  }'
```
