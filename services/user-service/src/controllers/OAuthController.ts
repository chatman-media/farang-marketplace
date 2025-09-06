import { Request, Response } from 'express';
import { OAuthService } from '../services/OAuthService';
import {
  AuthProvider,
  OAuthLoginRequest,
  LinkSocialAccountRequest,
  UnlinkSocialAccountRequest,
} from '@marketplace/shared-types';

export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  // GET /auth/:provider
  async initiateOAuth(req: Request, res: Response): Promise<void> {
    try {
      const provider = req.params.provider as AuthProvider;

      if (!Object.values(AuthProvider).includes(provider)) {
        res.status(400).json({ error: 'Unsupported OAuth provider' });
        return;
      }

      if (provider === AuthProvider.TELEGRAM) {
        res.status(400).json({
          error: 'Telegram uses Login Widget, not redirect flow',
          telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME,
        });
        return;
      }

      const state = this.oauthService.generateState();
      const authUrl = await this.oauthService.getAuthorizationUrl(
        provider,
        state
      );

      // Сохраняем state в сессии или Redis для проверки
      req.session = req.session || {};
      req.session.oauthState = state;
      req.session.oauthProvider = provider;

      res.json({ authUrl, state });
    } catch (error) {
      console.error('OAuth initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }
  }

  // POST /auth/:provider/callback
  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const provider = req.params.provider as AuthProvider;
      const { code, state, telegramData } = req.body;

      if (!Object.values(AuthProvider).includes(provider)) {
        res.status(400).json({ error: 'Unsupported OAuth provider' });
        return;
      }

      // Проверяем state для защиты от CSRF (кроме Telegram)
      if (provider !== AuthProvider.TELEGRAM) {
        const sessionState = req.session?.oauthState;
        const sessionProvider = req.session?.oauthProvider;

        if (
          !sessionState ||
          !sessionProvider ||
          sessionState !== state ||
          sessionProvider !== provider
        ) {
          res.status(400).json({ error: 'Invalid state parameter' });
          return;
        }

        if (!code) {
          res.status(400).json({ error: 'Authorization code is required' });
          return;
        }
      }

      const oauthRequest: OAuthLoginRequest = {
        provider,
        code,
        state,
        telegramData,
      };

      const authResponse =
        await this.oauthService.authenticateWithProvider(oauthRequest);

      // Очищаем сессию
      if (req.session) {
        delete req.session.oauthState;
        delete req.session.oauthProvider;
      }

      res.json(authResponse);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'OAuth authentication failed',
      });
    }
  }

  // POST /auth/link-social
  async linkSocialAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { provider, code, state, telegramData } = req.body;

      if (!Object.values(AuthProvider).includes(provider)) {
        res.status(400).json({ error: 'Unsupported OAuth provider' });
        return;
      }

      const linkRequest: LinkSocialAccountRequest = {
        provider,
        code,
        state,
        telegramData,
      };

      await this.oauthService.linkSocialAccount(userId, linkRequest);

      res.json({ message: 'Social account linked successfully' });
    } catch (error) {
      console.error('Link social account error:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to link social account',
      });
    }
  }

  // DELETE /auth/unlink-social
  async unlinkSocialAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { provider } = req.body;

      if (!Object.values(AuthProvider).includes(provider)) {
        res.status(400).json({ error: 'Unsupported OAuth provider' });
        return;
      }

      const unlinkRequest: UnlinkSocialAccountRequest = {
        provider,
      };

      await this.oauthService.unlinkSocialAccount(userId, unlinkRequest);

      res.json({ message: 'Social account unlinked successfully' });
    } catch (error) {
      console.error('Unlink social account error:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to unlink social account',
      });
    }
  }

  // GET /auth/social-accounts
  async getSocialAccounts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const socialAccounts = await this.oauthService.getSocialAccounts(userId);

      res.json(socialAccounts);
    } catch (error) {
      console.error('Get social accounts error:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve social accounts',
      });
    }
  }

  // GET /auth/providers
  async getAvailableProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = Object.values(AuthProvider).map((provider) => ({
        name: provider,
        displayName: this.getProviderDisplayName(provider),
        available: this.isProviderConfigured(provider),
      }));

      res.json({ providers });
    } catch (error) {
      console.error('Get providers error:', error);
      res.status(500).json({ error: 'Failed to retrieve available providers' });
    }
  }

  private getProviderDisplayName(provider: AuthProvider): string {
    const displayNames = {
      [AuthProvider.GOOGLE]: 'Google',
      [AuthProvider.APPLE]: 'Apple',
      [AuthProvider.TIKTOK]: 'TikTok',
      [AuthProvider.TELEGRAM]: 'Telegram',
      [AuthProvider.LINE]: 'LINE',
      [AuthProvider.WHATSAPP]: 'WhatsApp',
      [AuthProvider.EMAIL]: 'Email',
    };
    return displayNames[provider] || provider;
  }

  private isProviderConfigured(provider: AuthProvider): boolean {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        );
      case AuthProvider.APPLE:
        return !!(
          process.env.APPLE_CLIENT_ID &&
          process.env.APPLE_TEAM_ID &&
          process.env.APPLE_KEY_ID &&
          process.env.APPLE_PRIVATE_KEY_PATH
        );
      case AuthProvider.TIKTOK:
        return !!(
          process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET
        );
      case AuthProvider.TELEGRAM:
        return !!(
          process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME
        );
      case AuthProvider.LINE:
        return !!(
          process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET
        );
      case AuthProvider.WHATSAPP:
        return !!(
          process.env.WHATSAPP_APP_ID &&
          process.env.WHATSAPP_APP_SECRET &&
          process.env.WHATSAPP_PHONE_NUMBER_ID
        );
      case AuthProvider.EMAIL:
        return true; // Email всегда доступен
      default:
        return false;
    }
  }
}

import { TokenPayload } from '../services/AuthService';

// Расширяем типы Express для поддержки пользователя в запросе
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      session?: {
        oauthState?: string;
        oauthProvider?: AuthProvider;
      };
    }
  }
}
