# 身份验证文档

泰国市场身份验证系统文档。

## 概述

身份验证系统支持多种登录方式：

- ✅ **邮箱/密码** - 传统注册方式
- ✅ **Google OAuth 2.0** - 通过Google账户登录
- ✅ **Apple Sign In** - 通过Apple ID登录
- ✅ **TikTok Login Kit** - 通过TikTok登录
- ✅ **Telegram Login Widget** - 通过Telegram登录
- ✅ **LINE Login** - 通过LINE登录
- ✅ **WhatsApp Business API** - 通过WhatsApp登录

## 文档

### 📋 [oauth-api.md](../../auth/oauth-api.md)
描述所有OAuth提供商的主要文档：
- 每个提供商的API端点
- 请求和响应示例
- 错误处理
- 安全性和验证

### 🔧 [oauth-setup-guide.md](../../auth/oauth-setup-guide.md)
技术设置指南：
- 每个提供商的分步设置
- 开发者控制台配置
- 环境变量
- 故障排除和调试

## 当前状态

### ✅ 已完成
- 基本邮箱/密码身份验证
- JWT令牌（访问+刷新）
- 用户角色
- 所有OAuth提供商已实现
- 完整文档
- 176个测试成功通过

### 🔄 开发中
- 前端组件
- 移动应用程序

### 📋 计划中
- 双因素身份验证（2FA）
- 生物识别身份验证
- 企业客户SSO

## 快速开始

### 1. 环境变量设置
```bash
# 复制.env.example到.env
cp .env.example .env

# 添加OAuth凭据
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_service_id
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
LINE_CHANNEL_ID=your_line_channel_id
WHATSAPP_APP_ID=your_whatsapp_app_id
# ... 其他提供商
```

### 2. 安装依赖
```bash
# 安装依赖
bun install
```

### 3. 启动服务
```bash
# 启动用户服务
bun run dev
```

### 4. 测试
```bash
# 运行测试
bun run test
```

## 架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   前端          │    │   用户服务       │    │   OAuth         │
│                 │    │                  │    │   提供商        │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ OAuth按钮   │ │◄──►│ │ OAuth服务    │ │◄──►│ Google, Apple,  │
│ └─────────────┘ │    │ └──────────────┘ │    │ TikTok, 等      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    └─────────────────┘
│ │ 认证上下文  │ │◄──►│ │ 用户服务     │ │
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

## 安全性

### 核心原则
- **状态参数** - CSRF攻击防护
- **PKCE** - 用于移动应用程序
- **令牌轮换** - 定期刷新令牌更新
- **速率限制** - 登录尝试限制
- **签名验证** - 签名验证（Telegram）

### 验证
- 验证所有OAuth回调
- 令牌过期检查
- 所有身份验证尝试的审计
- 可疑活动监控

## 支持的提供商

| 提供商 | 状态 | 功能 |
|--------|------|------|
| Google | ✅ | OAuth 2.0，个人资料+邮箱 |
| Apple | ✅ | 使用Apple登录，JWT |
| TikTok | ✅ | 登录套件，基本信息 |
| Telegram | ✅ | 登录小部件，哈希验证 |
| LINE | ✅ | 在亚洲流行 |
| WhatsApp | ✅ | 商业API |
| 邮箱 | ✅ | 传统注册 |

## API端点

### 主要端点
- `GET /api/oauth/providers` - 列出可用提供商
- `GET /api/oauth/:provider/auth` - 启动OAuth
- `POST /api/oauth/:provider/callback` - 处理回调
- `POST /api/oauth/:provider/link` - 链接账户
- `DELETE /api/oauth/:provider/unlink` - 取消链接账户

### 邮箱身份验证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 令牌刷新
- `POST /api/auth/logout` - 登出

## 支持

身份验证问题咨询：
- 📧 邮箱：dev-team@thailand-marketplace.com
- 💬 Slack：#auth-support
- 📖 Wiki：[身份验证Wiki](https://wiki.thailand-marketplace.com/auth)

## 更新日志

### v1.1.0（当前版本）
- 添加了所有OAuth提供商
- 完整实现WhatsApp、Apple、TikTok
- 增强安全性
- 完整文档

### v1.0.0
- 基本邮箱/密码身份验证
- JWT令牌
- 用户角色
- Telegram ID支持
