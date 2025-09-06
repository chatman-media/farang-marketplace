# OAuth提供商设置指南

本指南解释如何为泰国市场平台配置每个OAuth提供商。

## 先决条件

1. 将环境变量从`.env.example`复制到您的`.env`文件
2. 按照以下部分配置您要使用的每个提供商
3. 更新环境变量后重启用户服务

## Google OAuth设置

### 1. 创建Google Cloud项目
1. 前往[Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用Google+ API

### 2. 配置OAuth同意屏幕
1. 前往APIs & Services > OAuth consent screen
2. 选择"External"用户类型
3. 填写必填字段：
   - 应用名称："Thailand Marketplace"
   - 用户支持邮箱：您的邮箱
   - 开发者联系信息：您的邮箱

### 3. 创建OAuth凭据
1. 前往APIs & Services > Credentials
2. 点击"Create Credentials" > "OAuth 2.0 Client IDs"
3. 选择"Web application"
4. 添加授权重定向URI：
   - `http://localhost:3001/api/oauth/google/callback`（开发环境）
   - `https://yourdomain.com/api/oauth/google/callback`（生产环境）

### 4. 环境变量
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback
```

## Apple Sign In设置

### 1. Apple开发者账户
1. 您需要Apple开发者账户（$99/年）
2. 前往[Apple Developer Portal](https://developer.apple.com/)

### 2. 创建App ID
1. 前往Certificates, Identifiers & Profiles
2. 创建具有Sign In with Apple功能的新App ID

### 3. 创建Service ID
1. 创建新的Services ID
2. 配置Sign In with Apple
3. 添加您的域名和重定向URL

### 4. 创建私钥
1. 前往Keys部分
2. 创建具有Sign In with Apple功能的新密钥
3. 下载.p8文件并记录Key ID

### 5. 环境变量
```env
APPLE_CLIENT_ID=com.yourapp.service-id
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_YOUR_KEY_ID.p8
APPLE_CALLBACK_URL=http://localhost:3001/api/oauth/apple/callback
```

## TikTok Login Kit设置

### 1. TikTok for Developers
1. 前往[TikTok for Developers](https://developers.tiktok.com/)
2. 创建开发者账户
3. 创建新应用

### 2. 配置Login Kit
1. 为您的应用启用Login Kit
2. 添加重定向URI
3. 请求必要的作用域：`user.info.basic`

### 3. 环境变量
```env
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_CALLBACK_URL=http://localhost:3001/api/oauth/tiktok/callback
```

## Telegram登录小部件设置

### 1. 创建Telegram机器人
1. 在Telegram上给[@BotFather](https://t.me/botfather)发消息
2. 使用`/newbot`命令创建新机器人
3. 获取您的机器人令牌和用户名

### 2. 配置域名
1. 与@BotFather使用`/setdomain`命令
2. 设置您的域名（例如，开发环境使用`localhost:3000`）

### 3. 环境变量
```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
```

## LINE登录设置

### 1. LINE开发者控制台
1. 前往[LINE Developers](https://developers.line.biz/)
2. 创建新的提供商和频道
3. 选择"LINE Login"频道类型

### 2. 配置频道
1. 设置频道名称和描述
2. 添加重定向URI
3. 配置作用域：`profile`、`openid`、`email`

### 3. 环境变量
```env
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CALLBACK_URL=http://localhost:3001/api/oauth/line/callback
```

## WhatsApp商业API设置

### 1. Meta for Developers
1. 前往[Meta for Developers](https://developers.facebook.com/)
2. 创建新应用
3. 添加WhatsApp Business API产品

### 2. 配置WhatsApp
1. 设置商业电话号码
2. 配置webhook URL
3. 获取必要权限

### 3. 环境变量
```env
WHATSAPP_APP_ID=your-whatsapp-app-id
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_CALLBACK_URL=http://localhost:3001/api/oauth/whatsapp/callback
```

## 测试OAuth流程

### 1. 检查可用提供商
```bash
curl http://localhost:3001/api/oauth/providers
```

### 2. 测试OAuth流程
```bash
# 初始化OAuth
curl "http://localhost:3001/api/oauth/google/auth"

# 在浏览器中访问返回的authUrl
# 完成授权
# 在回调中使用返回的代码

curl -X POST "http://localhost:3001/api/oauth/google/callback" \
  -H "Content-Type: application/json" \
  -d '{"code": "authorization_code", "state": "state_value"}'
```

## 生产环境考虑

1. **仅HTTPS**：所有OAuth流程在生产环境中必须使用HTTPS
2. **域名验证**：在每个提供商处注册您的生产域名
3. **速率限制**：在OAuth端点上实施速率限制
4. **错误处理**：提供用户友好的错误消息
5. **安全性**：验证所有OAuth响应并实施CSRF保护

## 故障排除

### 常见问题
1. **无效的重定向URI**：确保URI在提供商设置中完全匹配
2. **作用域错误**：检查请求的作用域是否已为您的应用批准
3. **令牌过期**：实施适当的令牌刷新逻辑
4. **CORS错误**：为您的前端域配置CORS设置

### 调试模式
设置`NODE_ENV=development`以在日志中查看详细的OAuth错误消息。
