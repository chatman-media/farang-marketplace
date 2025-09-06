import { randomBytes, createHash, createHmac } from 'crypto';
import { UserService } from './UserService';
import { AuthService } from './AuthService';
import {
  AuthProvider,
  SocialProfile,
  OAuthLoginRequest,
  LinkSocialAccountRequest,
  UnlinkSocialAccountRequest,
  SocialAccountsResponse,
  AuthResponse,
  User,
  UserRole,
} from '@marketplace/shared-types';

export interface OAuthProvider {
  getAuthorizationUrl(state: string): string;
  getUserProfile(
    request: OAuthLoginRequest | LinkSocialAccountRequest
  ): Promise<SocialProfile>;
}

export interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  apple?: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKeyPath: string;
    redirectUri: string;
  };
  tiktok?: {
    clientKey: string;
    clientSecret: string;
    redirectUri: string;
  };
  telegram?: {
    botToken: string;
    botUsername: string;
  };
  line?: {
    channelId: string;
    channelSecret: string;
    redirectUri: string;
  };
  whatsapp?: {
    appId: string;
    appSecret: string;
    phoneNumberId: string;
    redirectUri: string;
  };
}

export class OAuthService {
  private readonly providers: Map<AuthProvider, OAuthProvider> = new Map();
  private readonly config: OAuthConfig;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.config = this.loadConfig();
    this.initializeProviders();
  }

  private loadConfig(): OAuthConfig {
    return {
      google: process.env.GOOGLE_CLIENT_ID
        ? {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            redirectUri:
              process.env.GOOGLE_CALLBACK_URL ||
              `${process.env.BACKEND_URL}/auth/google/callback`,
          }
        : undefined,
      apple: process.env.APPLE_CLIENT_ID
        ? {
            clientId: process.env.APPLE_CLIENT_ID!,
            teamId: process.env.APPLE_TEAM_ID!,
            keyId: process.env.APPLE_KEY_ID!,
            privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH!,
            redirectUri:
              process.env.APPLE_CALLBACK_URL ||
              `${process.env.BACKEND_URL}/auth/apple/callback`,
          }
        : undefined,
      tiktok: process.env.TIKTOK_CLIENT_KEY
        ? {
            clientKey: process.env.TIKTOK_CLIENT_KEY!,
            clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
            redirectUri:
              process.env.TIKTOK_REDIRECT_URI ||
              `${process.env.BACKEND_URL}/auth/tiktok/callback`,
          }
        : undefined,
      telegram: process.env.TELEGRAM_BOT_TOKEN
        ? {
            botToken: process.env.TELEGRAM_BOT_TOKEN!,
            botUsername: process.env.TELEGRAM_BOT_USERNAME!,
          }
        : undefined,
      line: process.env.LINE_CHANNEL_ID
        ? {
            channelId: process.env.LINE_CHANNEL_ID!,
            channelSecret: process.env.LINE_CHANNEL_SECRET!,
            redirectUri:
              process.env.LINE_CALLBACK_URL ||
              `${process.env.BACKEND_URL}/auth/line/callback`,
          }
        : undefined,
      whatsapp: process.env.WHATSAPP_APP_ID
        ? {
            appId: process.env.WHATSAPP_APP_ID!,
            appSecret: process.env.WHATSAPP_APP_SECRET!,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
            redirectUri:
              process.env.WHATSAPP_CALLBACK_URL ||
              `${process.env.BACKEND_URL}/auth/whatsapp/callback`,
          }
        : undefined,
    };
  }

  private initializeProviders() {
    if (this.config.google) {
      this.providers.set(
        AuthProvider.GOOGLE,
        new GoogleOAuthProvider(this.config.google)
      );
    }
    if (this.config.apple) {
      this.providers.set(
        AuthProvider.APPLE,
        new AppleOAuthProvider(this.config.apple)
      );
    }
    if (this.config.tiktok) {
      this.providers.set(
        AuthProvider.TIKTOK,
        new TikTokOAuthProvider(this.config.tiktok)
      );
    }
    if (this.config.telegram) {
      this.providers.set(
        AuthProvider.TELEGRAM,
        new TelegramOAuthProvider(this.config.telegram)
      );
    }
    if (this.config.line) {
      this.providers.set(
        AuthProvider.LINE,
        new LineOAuthProvider(this.config.line)
      );
    }
    if (this.config.whatsapp) {
      this.providers.set(
        AuthProvider.WHATSAPP,
        new WhatsAppOAuthProvider(this.config.whatsapp)
      );
    }
  }

  generateState(): string {
    return randomBytes(32).toString('hex');
  }

  async getAuthorizationUrl(
    provider: AuthProvider,
    state: string
  ): Promise<string> {
    const oauthProvider = this.providers.get(provider);
    if (!oauthProvider) {
      throw new Error(`Provider ${provider} is not configured or supported`);
    }
    return oauthProvider.getAuthorizationUrl(state);
  }

  async authenticateWithProvider(
    request: OAuthLoginRequest
  ): Promise<AuthResponse> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(
        `Provider ${request.provider} is not configured or supported`
      );
    }

    // Получаем профиль от провайдера
    const socialProfile = await provider.getUserProfile(request);

    // Ищем существующего пользователя по социальному профилю
    let user = await this.findUserBySocialProfile(socialProfile);

    if (!user) {
      // Проверяем, есть ли пользователь с таким email
      if (socialProfile.email) {
        const existingUser = await this.userService.getUserByEmail(
          socialProfile.email
        );
        if (existingUser) {
          // Связываем социальный профиль с существующим пользователем
          await this.saveSocialProfile(existingUser.id, socialProfile);
          user = existingUser;
        }
      }

      if (!user) {
        // Создаем нового пользователя
        user = await this.createUserFromSocialProfile(socialProfile);
      }
    } else {
      // Обновляем существующий социальный профиль
      await this.updateSocialProfile(user.id, socialProfile);
    }

    // Генерируем токены через AuthService
    // Получаем UserEntity для генерации токенов
    const userEntity = await this.userService.validateUserCredentials(
      user.email!,
      'oauth-login'
    );
    if (!userEntity) {
      throw new Error('Failed to retrieve user entity for token generation');
    }

    const accessToken = (this.authService as any).generateAccessToken(
      userEntity
    );
    const refreshToken = (this.authService as any).generateRefreshToken(
      userEntity
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async linkSocialAccount(
    userId: string,
    request: LinkSocialAccountRequest
  ): Promise<void> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(
        `Provider ${request.provider} is not configured or supported`
      );
    }

    const socialProfile = await provider.getUserProfile(request);

    // Проверяем, не связан ли уже этот аккаунт с другим пользователем
    const existingUser = await this.findUserBySocialProfile(socialProfile);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('This social account is already linked to another user');
    }

    // Проверяем, не связан ли уже этот провайдер с текущим пользователем
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingProfile = user.socialProfiles?.find(
      (p: SocialProfile) => p.provider === request.provider
    );
    if (existingProfile) {
      throw new Error(
        `${request.provider} account is already linked to this user`
      );
    }

    await this.saveSocialProfile(userId, socialProfile);
  }

  async unlinkSocialAccount(
    userId: string,
    request: UnlinkSocialAccountRequest
  ): Promise<void> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Проверяем, что это не единственный способ входа
    const socialProfiles = user.socialProfiles || [];
    const hasPassword = user.email; // Предполагаем, что если есть email, то есть и пароль

    if (
      socialProfiles.length === 1 &&
      socialProfiles[0].provider === request.provider &&
      !hasPassword
    ) {
      throw new Error(
        'Cannot unlink the only authentication method. Please set a password first.'
      );
    }

    const profileExists = socialProfiles.find(
      (p: SocialProfile) => p.provider === request.provider
    );
    if (!profileExists) {
      throw new Error(`${request.provider} account is not linked to this user`);
    }

    await this.removeSocialProfile(userId, request.provider);
  }

  async getSocialAccounts(userId: string): Promise<SocialAccountsResponse> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      socialProfiles: user.socialProfiles || [],
      primaryProvider: user.primaryAuthProvider || AuthProvider.EMAIL,
    };
  }

  private async findUserBySocialProfile(
    _socialProfile: SocialProfile
  ): Promise<User | null> {
    // Здесь нужно будет реализовать поиск в базе данных
    // Пока возвращаем null, так как нужно расширить UserRepository
    return null;
  }

  private async createUserFromSocialProfile(
    _socialProfile: SocialProfile
  ): Promise<User> {
    const userData = {
      email:
        _socialProfile.email ||
        `${_socialProfile.providerId}@${_socialProfile.provider}.local`,
      password: randomBytes(32).toString('hex'), // Случайный пароль
      role: UserRole.USER,
      profile: {
        firstName: this.extractFirstName(_socialProfile.name),
        lastName: this.extractLastName(_socialProfile.name),
        avatar: _socialProfile.avatar,
        location: undefined,
        socialProfiles: [_socialProfile],
        primaryAuthProvider: _socialProfile.provider,
      },
    };

    return await this.userService.createUser(userData);
  }

  private async saveSocialProfile(
    userId: string,
    _socialProfile: SocialProfile
  ): Promise<void> {
    // Здесь нужно будет реализовать сохранение в базе данных
    // Пока заглушка
    console.log(`Saving social profile for user ${userId}`);
  }

  private async updateSocialProfile(
    userId: string,
    _socialProfile: SocialProfile
  ): Promise<void> {
    // Здесь нужно будет реализовать обновление в базе данных
    // Пока заглушка
    console.log(`Updating social profile for user ${userId}`);
  }

  private async removeSocialProfile(
    userId: string,
    provider: AuthProvider
  ): Promise<void> {
    // Здесь нужно будет реализовать удаление из базы данных
    // Пока заглушка
    console.log(`Removing social profile ${provider} for user ${userId}`);
  }

  private extractFirstName(fullName?: string): string {
    if (!fullName) return 'User';
    const parts = fullName.trim().split(' ');
    return parts[0] || 'User';
  }

  private extractLastName(fullName?: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts.slice(1).join(' ');
  }
}

// Базовый класс для OAuth провайдеров
export abstract class BaseOAuthProvider implements OAuthProvider {
  abstract getAuthorizationUrl(state: string): string;
  abstract getUserProfile(
    request: OAuthLoginRequest | LinkSocialAccountRequest
  ): Promise<SocialProfile>;

  protected generateState(): string {
    return randomBytes(32).toString('hex');
  }

  protected validateState(
    receivedState: string,
    expectedState: string
  ): boolean {
    return receivedState === expectedState;
  }
}

// Google OAuth Provider
export class GoogleOAuthProvider extends BaseOAuthProvider {
  constructor(private config: NonNullable<OAuthConfig['google']>) {
    super();
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'profile email',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.code) {
      throw new Error('Authorization code is required for Google OAuth');
    }

    // Обмениваем код на токен
    const tokenResponse = await this.exchangeCodeForToken(request.code);

    // Получаем профиль пользователя
    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

    return {
      provider: AuthProvider.GOOGLE,
      providerId: userInfo.id,
      email: userInfo.email,
      name: `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim(),
      avatar: userInfo.picture,
      username: userInfo.email,
      connectedAt: new Date().toISOString(),
    };
  }

  private async exchangeCodeForToken(
    code: string
  ): Promise<{ access_token: string }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json() as Promise<{ access_token: string }>;
  }

  private async fetchUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user info: ${error}`);
    }

    return response.json() as Promise<{
      id: string;
      email: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    }>;
  }
}

// Telegram OAuth Provider
export class TelegramOAuthProvider extends BaseOAuthProvider {
  constructor(private config: NonNullable<OAuthConfig['telegram']>) {
    super();
  }

  getAuthorizationUrl(_state: string): string {
    // Telegram использует Widget, не redirect URL
    throw new Error('Telegram uses Login Widget, not authorization URL');
  }

  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.telegramData) {
      throw new Error('Telegram data is required');
    }

    // Проверяем подпись
    if (!this.verifyTelegramAuth(request.telegramData)) {
      throw new Error('Invalid Telegram authentication data');
    }

    const { id, first_name, last_name, username, photo_url } =
      request.telegramData;

    return {
      provider: AuthProvider.TELEGRAM,
      providerId: id.toString(),
      name: `${first_name} ${last_name || ''}`.trim(),
      avatar: photo_url,
      username,
      connectedAt: new Date().toISOString(),
    };
  }

  private verifyTelegramAuth(data: any): boolean {
    const { hash, ...authData } = data;

    // Создаем строку для проверки
    const dataCheckString = Object.keys(authData)
      .sort()
      .map((key) => `${key}=${authData[key]}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = createHash('sha256')
      .update(this.config.botToken)
      .digest();

    // Вычисляем HMAC
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  }
}

export class AppleOAuthProvider extends BaseOAuthProvider {
  constructor(private config: NonNullable<OAuthConfig['apple']>) {
    super();
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post',
      state,
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.code) {
      throw new Error('Authorization code is required for Apple Sign In');
    }

    // Обмен кода на токен доступа
    const tokenResponse = await this.exchangeCodeForToken(request.code);

    // Apple не предоставляет API для получения профиля после первой авторизации
    // Информация о пользователе приходит только в первый раз в id_token
    const userInfo = this.decodeIdToken(tokenResponse.id_token);

    return {
      provider: AuthProvider.APPLE,
      providerId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      connectedAt: new Date().toISOString(),
    };
  }

  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    id_token: string;
    token_type: string;
  }> {
    // Создаем client_secret JWT для Apple
    const clientSecret = await this.generateClientSecret();

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json() as Promise<{
      access_token: string;
      id_token: string;
      token_type: string;
    }>;
  }

  private async generateClientSecret(): Promise<string> {
    // Для Apple Sign In нужно генерировать JWT с приватным ключом
    // Это упрощенная версия - в реальном проекте используйте библиотеку jsonwebtoken
    const jwt = require('jsonwebtoken');
    const fs = require('fs');

    const privateKey = fs.readFileSync(this.config.privateKeyPath);

    const payload = {
      iss: this.config.teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 час
      aud: 'https://appleid.apple.com',
      sub: this.config.clientId,
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        kid: this.config.keyId,
      },
    });
  }

  private decodeIdToken(idToken: string): {
    sub: string;
    email?: string;
    name?: string;
  } {
    // Простое декодирование JWT (без проверки подписи для примера)
    const payload = idToken.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name ? `${decoded.name.firstName || ''} ${decoded.name.lastName || ''}`.trim() : undefined,
    };
  }
}

export class TikTokOAuthProvider extends BaseOAuthProvider {
  constructor(private config: NonNullable<OAuthConfig['tiktok']>) {
    super();
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'user.info.basic',
      state,
    });

    return `https://www.tiktok.com/auth/authorize/?${params.toString()}`;
  }

  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.code) {
      throw new Error('Authorization code is required for TikTok Login');
    }

    // Обмен кода на токен доступа
    const tokenResponse = await this.exchangeCodeForToken(request.code);

    // Получение профиля пользователя
    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

    return {
      provider: AuthProvider.TIKTOK,
      providerId: userInfo.data.user.open_id,
      name: userInfo.data.user.display_name,
      avatar: userInfo.data.user.avatar_url,
      username: userInfo.data.user.username,
      connectedAt: new Date().toISOString(),
    };
  }

  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const response = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const result = await response.json() as any;

    if (result.error_code !== 0) {
      throw new Error(`TikTok OAuth error: ${result.message}`);
    }

    return result.data;
  }

  private async fetchUserInfo(accessToken: string): Promise<{
    data: {
      user: {
        open_id: string;
        display_name: string;
        avatar_url: string;
        username: string;
      };
    };
  }> {
    const response = await fetch('https://open-api.tiktok.com/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: ['open_id', 'display_name', 'avatar_url', 'username'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user info: ${error}`);
    }

    const result = await response.json() as any;

    if (result.error_code !== 0) {
      throw new Error(`TikTok API error: ${result.message}`);
    }

    return result;
  }
}

export class LineOAuthProvider extends BaseOAuthProvider {
  constructor(private config: NonNullable<OAuthConfig['line']>) {
    super();
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.channelId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: 'profile openid email',
      nonce: randomBytes(16).toString('hex'),
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.code) {
      throw new Error('Authorization code is required');
    }

    // Обмен кода на токен доступа
    const tokenResponse = await this.exchangeCodeForToken(request.code);

    // Получение профиля пользователя
    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

    return {
      provider: AuthProvider.LINE,
      providerId: userInfo.userId,
      email: userInfo.email,
      name: userInfo.displayName,
      avatar: userInfo.pictureUrl,
      connectedAt: new Date().toISOString(),
    };
  }

  private async exchangeCodeForToken(
    code: string
  ): Promise<{ access_token: string; id_token?: string }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.channelId,
      client_secret: this.config.channelSecret,
    });

    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const result = await response.json();
    return result as { access_token: string; id_token?: string };
  }

  private async fetchUserInfo(accessToken: string): Promise<{
    userId: string;
    displayName?: string;
    pictureUrl?: string;
    email?: string;
  }> {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user info: ${error}`);
    }

    const result = await response.json();
    return result as {
      userId: string;
      displayName?: string;
      pictureUrl?: string;
      email?: string;
    };
  }
}

export class WhatsAppOAuthProvider extends BaseOAuthProvider {
  constructor(private config: NonNullable<OAuthConfig['whatsapp']>) {
    super();
  }

  getAuthorizationUrl(state: string): string {
    // WhatsApp Business API OAuth URL
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: 'whatsapp_business_management',
      response_type: 'code',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async getUserProfile(request: OAuthLoginRequest): Promise<SocialProfile> {
    if (!request.code) {
      throw new Error('Authorization code is required for WhatsApp OAuth');
    }

    // Обмен кода на токен доступа
    const tokenResponse = await this.exchangeCodeForToken(request.code);

    // Получение информации о бизнес-аккаунте
    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

    return {
      provider: AuthProvider.WHATSAPP,
      providerId: userInfo.id,
      name: userInfo.name,
      connectedAt: new Date().toISOString(),
    };
  }

  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
  }> {
    const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        redirect_uri: this.config.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json() as Promise<{
      access_token: string;
      token_type: string;
    }>;
  }

  private async fetchUserInfo(accessToken: string): Promise<{
    id: string;
    name?: string;
  }> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user info: ${error}`);
    }

    return response.json() as Promise<{
      id: string;
      name?: string;
    }>;
  }
}
