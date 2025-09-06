# OAuth Implementation Technical Guide

Техническое руководство по реализации OAuth провайдеров в Thailand Marketplace.

## Архитектура системы

### 1. Структура базы данных

#### Таблица users (обновления)
```sql
ALTER TABLE users ADD COLUMN primary_auth_provider VARCHAR(20) DEFAULT 'email';
ALTER TABLE users ADD COLUMN social_profiles JSONB DEFAULT '[]';

-- Индексы для быстрого поиска
CREATE INDEX idx_users_primary_auth_provider ON users(primary_auth_provider);
CREATE INDEX idx_users_social_profiles ON users USING GIN(social_profiles);
```

#### Новая таблица social_profiles
```sql
CREATE TABLE social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  avatar VARCHAR(500),
  username VARCHAR(255),
  raw_data JSONB,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(provider, provider_id),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_social_profiles_user_id ON social_profiles(user_id);
CREATE INDEX idx_social_profiles_provider ON social_profiles(provider);
CREATE INDEX idx_social_profiles_provider_id ON social_profiles(provider, provider_id);
```

### 2. Сервисы и компоненты

#### OAuthService
```typescript
// services/user-service/src/services/OAuthService.ts
import { AuthProvider, SocialProfile, OAuthLoginRequest } from '@thailand-marketplace/shared-types'

export class OAuthService {
  private readonly providers: Map<AuthProvider, OAuthProvider>
  
  constructor(
    private userService: UserService,
    private jwtService: JWTService,
    private configService: ConfigService
  ) {
    this.initializeProviders()
  }
  
  private initializeProviders() {
    this.providers.set(AuthProvider.GOOGLE, new GoogleOAuthProvider(this.configService))
    this.providers.set(AuthProvider.APPLE, new AppleOAuthProvider(this.configService))
    this.providers.set(AuthProvider.TIKTOK, new TikTokOAuthProvider(this.configService))
    this.providers.set(AuthProvider.TELEGRAM, new TelegramOAuthProvider(this.configService))
    this.providers.set(AuthProvider.LINE, new LineOAuthProvider(this.configService))
  }
  
  async getAuthorizationUrl(provider: AuthProvider, state: string): Promise<string> {
    const oauthProvider = this.providers.get(provider)
    if (!oauthProvider) {
      throw new Error(`Provider ${provider} not supported`)
    }
    return oauthProvider.getAuthorizationUrl(state)
  }
  
  async authenticateWithProvider(request: OAuthLoginRequest): Promise<AuthResponse> {
    const provider = this.providers.get(request.provider)
    if (!provider) {
      throw new Error(`Provider ${request.provider} not supported`)
    }
    
    // Получаем профиль от провайдера
    const socialProfile = await provider.getUserProfile(request)
    
    // Ищем существующего пользователя
    let user = await this.findUserBySocialProfile(socialProfile)
    
    if (!user) {
      // Создаем нового пользователя
      user = await this.createUserFromSocialProfile(socialProfile)
    } else {
      // Обновляем существующий профиль
      await this.updateSocialProfile(user.id, socialProfile)
    }
    
    // Генерируем токены
    const tokens = await this.jwtService.generateTokens(user)
    
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  }
  
  async linkSocialAccount(userId: string, request: LinkSocialAccountRequest): Promise<void> {
    const provider = this.providers.get(request.provider)
    if (!provider) {
      throw new Error(`Provider ${request.provider} not supported`)
    }
    
    const socialProfile = await provider.getUserProfile(request)
    
    // Проверяем, не связан ли уже этот аккаунт с другим пользователем
    const existingUser = await this.findUserBySocialProfile(socialProfile)
    if (existingUser && existingUser.id !== userId) {
      throw new Error('This social account is already linked to another user')
    }
    
    await this.saveSocialProfile(userId, socialProfile)
  }
  
  async unlinkSocialAccount(userId: string, provider: AuthProvider): Promise<void> {
    const user = await this.userService.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    // Проверяем, что это не единственный способ входа
    const socialProfiles = await this.getSocialProfiles(userId)
    if (socialProfiles.length === 1 && socialProfiles[0].provider === provider && !user.email) {
      throw new Error('Cannot unlink the only authentication method')
    }
    
    await this.removeSocialProfile(userId, provider)
  }
}
```

#### Базовый OAuthProvider
```typescript
// services/user-service/src/providers/OAuthProvider.ts
export abstract class OAuthProvider {
  constructor(protected config: ConfigService) {}
  
  abstract getAuthorizationUrl(state: string): string
  abstract getUserProfile(request: OAuthLoginRequest | LinkSocialAccountRequest): Promise<SocialProfile>
  
  protected generateState(): string {
    return crypto.randomBytes(32).toString('hex')
  }
  
  protected validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState
  }
}
```

#### Google OAuth Provider
```typescript
// services/user-service/src/providers/GoogleOAuthProvider.ts
export class GoogleOAuthProvider extends OAuthProvider {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  
  constructor(config: ConfigService) {
    super(config)
    this.clientId = config.get('GOOGLE_CLIENT_ID')
    this.clientSecret = config.get('GOOGLE_CLIENT_SECRET')
    this.redirectUri = config.get('GOOGLE_CALLBACK_URL')
  }
  
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'profile email',
      state,
      access_type: 'offline',
      prompt: 'consent'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }
  
  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.code) {
      throw new Error('Authorization code is required')
    }
    
    // Обмениваем код на токен
    const tokenResponse = await this.exchangeCodeForToken(request.code)
    
    // Получаем профиль пользователя
    const userInfo = await this.fetchUserInfo(tokenResponse.access_token)
    
    return {
      provider: AuthProvider.GOOGLE,
      providerId: userInfo.id,
      email: userInfo.email,
      name: `${userInfo.given_name} ${userInfo.family_name}`.trim(),
      avatar: userInfo.picture,
      username: userInfo.email,
      connectedAt: new Date().toISOString()
    }
  }
  
  private async exchangeCodeForToken(code: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token')
    }
    
    return response.json()
  }
  
  private async fetchUserInfo(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }
    
    return response.json()
  }
}
```

#### Telegram OAuth Provider
```typescript
// services/user-service/src/providers/TelegramOAuthProvider.ts
export class TelegramOAuthProvider extends OAuthProvider {
  private readonly botToken: string
  
  constructor(config: ConfigService) {
    super(config)
    this.botToken = config.get('TELEGRAM_BOT_TOKEN')
  }
  
  getAuthorizationUrl(state: string): string {
    // Telegram использует Widget, не redirect URL
    throw new Error('Telegram uses Login Widget, not authorization URL')
  }
  
  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.telegramData) {
      throw new Error('Telegram data is required')
    }
    
    // Проверяем подпись
    if (!this.verifyTelegramAuth(request.telegramData)) {
      throw new Error('Invalid Telegram authentication data')
    }
    
    const { id, first_name, last_name, username, photo_url } = request.telegramData
    
    return {
      provider: AuthProvider.TELEGRAM,
      providerId: id.toString(),
      name: `${first_name} ${last_name || ''}`.trim(),
      avatar: photo_url,
      username,
      connectedAt: new Date().toISOString()
    }
  }
  
  private verifyTelegramAuth(data: any): boolean {
    const { hash, ...authData } = data
    
    // Создаем строку для проверки
    const dataCheckString = Object.keys(authData)
      .sort()
      .map(key => `${key}=${authData[key]}`)
      .join('\n')
    
    // Создаем секретный ключ
    const secretKey = crypto.createHash('sha256').update(this.botToken).digest()
    
    // Вычисляем HMAC
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')
    
    return calculatedHash === hash
  }
}
```

### 3. API Endpoints

#### OAuth Routes
```typescript
// services/user-service/src/routes/oauth.ts
import { Router } from 'express'
import { OAuthService } from '../services/OAuthService'
import { AuthProvider } from '@thailand-marketplace/shared-types'

const router = Router()

// Инициация OAuth flow
router.get('/auth/:provider', async (req, res) => {
  try {
    const provider = req.params.provider as AuthProvider
    const state = crypto.randomBytes(32).toString('hex')
    
    // Сохраняем state в сессии или Redis
    req.session.oauthState = state
    
    const authUrl = await oauthService.getAuthorizationUrl(provider, state)
    res.redirect(authUrl)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Callback для OAuth провайдеров
router.get('/auth/:provider/callback', async (req, res) => {
  try {
    const provider = req.params.provider as AuthProvider
    const { code, state, error } = req.query
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${error}`)
    }
    
    // Проверяем state
    if (state !== req.session.oauthState) {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }
    
    const authResponse = await oauthService.authenticateWithProvider({
      provider,
      code: code as string,
      state: state as string
    })
    
    // Устанавливаем токены в cookies или возвращаем в redirect
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${authResponse.accessToken}`)
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error.message)}`)
  }
})

// Прямая аутентификация (для Telegram)
router.post('/auth/:provider', async (req, res) => {
  try {
    const provider = req.params.provider as AuthProvider
    
    if (provider === AuthProvider.TELEGRAM) {
      const authResponse = await oauthService.authenticateWithProvider({
        provider,
        telegramData: req.body
      })
      
      res.json(authResponse)
    } else {
      res.status(400).json({ error: 'Direct authentication not supported for this provider' })
    }
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Связывание социального аккаунта
router.post('/auth/link/:provider', authenticateToken, async (req, res) => {
  try {
    const provider = req.params.provider as AuthProvider
    const userId = req.user.id
    
    await oauthService.linkSocialAccount(userId, {
      provider,
      ...req.body
    })
    
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Отвязывание социального аккаунта
router.delete('/auth/unlink/:provider', authenticateToken, async (req, res) => {
  try {
    const provider = req.params.provider as AuthProvider
    const userId = req.user.id
    
    await oauthService.unlinkSocialAccount(userId, provider)
    
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Получение связанных аккаунтов
router.get('/auth/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const accounts = await oauthService.getSocialAccounts(userId)
    
    res.json(accounts)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
```

### 4. Frontend интеграция

#### React компонент для OAuth
```typescript
// apps/web/src/components/auth/OAuthButtons.tsx
import React from 'react'
import { AuthProvider } from '@thailand-marketplace/shared-types'

interface OAuthButtonsProps {
  onSuccess?: (token: string) => void
  onError?: (error: string) => void
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onSuccess, onError }) => {
  const handleOAuthLogin = (provider: AuthProvider) => {
    if (provider === AuthProvider.TELEGRAM) {
      // Для Telegram используем Widget
      initTelegramWidget()
    } else {
      // Для остальных провайдеров - redirect
      window.location.href = `${process.env.REACT_APP_API_URL}/auth/${provider}`
    }
  }
  
  const initTelegramWidget = () => {
    // Инициализация Telegram Login Widget
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', process.env.REACT_APP_TELEGRAM_BOT_USERNAME!)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    
    // Добавляем глобальную функцию для callback
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/telegram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        })
        
        const data = await response.json()
        
        if (response.ok) {
          onSuccess?.(data.accessToken)
        } else {
          onError?.(data.error)
        }
      } catch (error) {
        onError?.('Authentication failed')
      }
    }
    
    document.body.appendChild(script)
  }
  
  return (
    <div className="oauth-buttons">
      <button 
        onClick={() => handleOAuthLogin(AuthProvider.GOOGLE)}
        className="oauth-button google"
      >
        <GoogleIcon /> Continue with Google
      </button>
      
      <button 
        onClick={() => handleOAuthLogin(AuthProvider.APPLE)}
        className="oauth-button apple"
      >
        <AppleIcon /> Continue with Apple
      </button>
      
      <button 
        onClick={() => handleOAuthLogin(AuthProvider.TIKTOK)}
        className="oauth-button tiktok"
      >
        <TikTokIcon /> Continue with TikTok
      </button>
      
      <button 
        onClick={() => handleOAuthLogin(AuthProvider.TELEGRAM)}
        className="oauth-button telegram"
      >
        <TelegramIcon /> Continue with Telegram
      </button>
      
      <button 
        onClick={() => handleOAuthLogin(AuthProvider.LINE)}
        className="oauth-button line"
      >
        <LineIcon /> Continue with LINE
      </button>
    </div>
  )
}
```

### 5. Тестирование

#### Unit тесты для OAuthService
```typescript
// services/user-service/src/tests/OAuthService.test.ts
import { OAuthService } from '../services/OAuthService'
import { AuthProvider } from '@thailand-marketplace/shared-types'

describe('OAuthService', () => {
  let oauthService: OAuthService
  
  beforeEach(() => {
    // Инициализация сервиса с моками
  })
  
  describe('authenticateWithProvider', () => {
    it('should create new user for first-time Google login', async () => {
      // Тест создания нового пользователя
    })
    
    it('should link existing user for returning Google login', async () => {
      // Тест связывания существующего пользователя
    })
    
    it('should validate Telegram auth data', async () => {
      // Тест валидации Telegram данных
    })
  })
  
  describe('linkSocialAccount', () => {
    it('should link social account to existing user', async () => {
      // Тест связывания социального аккаунта
    })
    
    it('should prevent linking already linked account', async () => {
      // Тест предотвращения двойного связывания
    })
  })
})
```

### 6. Безопасность

#### Middleware для проверки состояния
```typescript
// services/user-service/src/middleware/oauthSecurity.ts
export const validateOAuthState = (req: Request, res: Response, next: NextFunction) => {
  const { state } = req.query
  const sessionState = req.session.oauthState
  
  if (!state || !sessionState || state !== sessionState) {
    return res.status(400).json({ error: 'Invalid or missing state parameter' })
  }
  
  // Очищаем state после использования
  delete req.session.oauthState
  
  next()
}

export const rateLimitOAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 попыток
  message: 'Too many OAuth attempts, please try again later'
})
```

### 7. Мониторинг и логирование

```typescript
// services/user-service/src/utils/oauthLogger.ts
export class OAuthLogger {
  static logAuthAttempt(provider: AuthProvider, success: boolean, userId?: string, error?: string) {
    const logData = {
      event: 'oauth_auth_attempt',
      provider,
      success,
      userId,
      error,
      timestamp: new Date().toISOString()
    }
    
    if (success) {
      logger.info('OAuth authentication successful', logData)
    } else {
      logger.warn('OAuth authentication failed', logData)
    }
  }
  
  static logAccountLink(provider: AuthProvider, userId: string, success: boolean, error?: string) {
    logger.info('Social account link attempt', {
      event: 'oauth_account_link',
      provider,
      userId,
      success,
      error,
      timestamp: new Date().toISOString()
    })
  }
}
```

Этот документ содержит полную техническую реализацию OAuth системы для всех запрошенных провайдеров.