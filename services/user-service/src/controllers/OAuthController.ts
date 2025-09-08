import { FastifyRequest, FastifyReply } from "fastify"
import { OAuthService } from "../services/OAuthService"
import {
  AuthProvider,
  OAuthLoginRequest,
  LinkSocialAccountRequest,
  UnlinkSocialAccountRequest,
} from "@marketplace/shared-types"

export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  // GET /auth/:provider
  async initiateOAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { provider } = req.params as { provider: string }

      if (!Object.values(AuthProvider).includes(provider as AuthProvider)) {
        reply.status(400).send({ error: "Unsupported OAuth provider" })
        return
      }

      if (provider === AuthProvider.TELEGRAM) {
        reply.status(400).send({
          error: "Telegram uses Login Widget, not redirect flow",
          telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME,
        })
        return
      }

      const state = this.oauthService.generateState()
      const authUrl = await this.oauthService.getAuthorizationUrl(provider as AuthProvider, state)

      // TODO: Сохранить state в Redis для проверки (Fastify не имеет встроенных сессий)
      // Пока что возвращаем state клиенту для проверки

      reply.send({ authUrl, state })
    } catch (error) {
      console.error("OAuth initiation error:", error)
      reply.status(500).send({ error: "Failed to initiate OAuth flow" })
    }
  }

  // POST /auth/:provider/callback
  async handleOAuthCallback(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { provider } = req.params as { provider: string }
      const { code, state, telegramData } = req.body as any

      if (!Object.values(AuthProvider).includes(provider as AuthProvider)) {
        reply.status(400).send({ error: "Unsupported OAuth provider" })
        return
      }

      // Проверяем state для защиты от CSRF (кроме Telegram)
      if (provider !== AuthProvider.TELEGRAM) {
        // TODO: Проверить state из Redis или другого хранилища
        // Пока что пропускаем проверку state, так как у нас нет сессий

        if (!code) {
          reply.status(400).send({ error: "Authorization code is required" })
          return
        }
      }

      const oauthRequest: OAuthLoginRequest = {
        provider: provider as AuthProvider,
        code,
        state,
        telegramData,
      }

      const authResponse = await this.oauthService.authenticateWithProvider(oauthRequest)

      reply.send(authResponse)
    } catch (error) {
      console.error("OAuth callback error:", error)
      reply.status(500).send({
        error: error instanceof Error ? error.message : "OAuth authentication failed",
      })
    }
  }

  // POST /auth/link-social
  async linkSocialAccount(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        reply.status(401).send({ error: "Authentication required" })
        return
      }

      const { provider, code, state, telegramData } = req.body as any

      if (!Object.values(AuthProvider).includes(provider)) {
        reply.status(400).send({ error: "Unsupported OAuth provider" })
        return
      }

      const linkRequest: LinkSocialAccountRequest = {
        provider,
        code,
        state,
        telegramData,
      }

      await this.oauthService.linkSocialAccount(userId, linkRequest)

      reply.send({ message: "Social account linked successfully" })
    } catch (error) {
      console.error("Link social account error:", error)
      reply.status(500).send({
        error: error instanceof Error ? error.message : "Failed to link social account",
      })
    }
  }

  // DELETE /auth/unlink-social
  async unlinkSocialAccount(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        reply.status(401).send({ error: "Authentication required" })
        return
      }

      const { provider } = req.body as any

      if (!Object.values(AuthProvider).includes(provider)) {
        reply.status(400).send({ error: "Unsupported OAuth provider" })
        return
      }

      const unlinkRequest: UnlinkSocialAccountRequest = {
        provider,
      }

      await this.oauthService.unlinkSocialAccount(userId, unlinkRequest)

      reply.send({ message: "Social account unlinked successfully" })
    } catch (error) {
      console.error("Unlink social account error:", error)
      reply.status(500).send({
        error: error instanceof Error ? error.message : "Failed to unlink social account",
      })
    }
  }

  // GET /auth/social-accounts
  async getSocialAccounts(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        reply.status(401).send({ error: "Authentication required" })
        return
      }

      const socialAccounts = await this.oauthService.getSocialAccounts(userId)

      reply.send(socialAccounts)
    } catch (error) {
      console.error("Get social accounts error:", error)
      reply.status(500).send({
        error: error instanceof Error ? error.message : "Failed to retrieve social accounts",
      })
    }
  }

  // GET /auth/providers
  async getAvailableProviders(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const providers = Object.values(AuthProvider).map((provider) => ({
        name: provider,
        displayName: this.getProviderDisplayName(provider),
        available: this.isProviderConfigured(provider),
      }))

      reply.send({ providers })
    } catch (error) {
      console.error("Get providers error:", error)
      reply.status(500).send({ error: "Failed to retrieve available providers" })
    }
  }

  private getProviderDisplayName(provider: AuthProvider): string {
    const displayNames = {
      [AuthProvider.GOOGLE]: "Google",
      [AuthProvider.APPLE]: "Apple",
      [AuthProvider.TIKTOK]: "TikTok",
      [AuthProvider.TELEGRAM]: "Telegram",
      [AuthProvider.LINE]: "LINE",
      [AuthProvider.WHATSAPP]: "WhatsApp",
      [AuthProvider.EMAIL]: "Email",
    }
    return displayNames[provider] || provider
  }

  private isProviderConfigured(provider: AuthProvider): boolean {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      case AuthProvider.APPLE:
        return !!(
          process.env.APPLE_CLIENT_ID &&
          process.env.APPLE_TEAM_ID &&
          process.env.APPLE_KEY_ID &&
          process.env.APPLE_PRIVATE_KEY_PATH
        )
      case AuthProvider.TIKTOK:
        return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET)
      case AuthProvider.TELEGRAM:
        return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME)
      case AuthProvider.LINE:
        return !!(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET)
      case AuthProvider.WHATSAPP:
        return !!(
          process.env.WHATSAPP_APP_ID &&
          process.env.WHATSAPP_APP_SECRET &&
          process.env.WHATSAPP_PHONE_NUMBER_ID
        )
      case AuthProvider.EMAIL:
        return true // Email всегда доступен
      default:
        return false
    }
  }
}
