import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { OAuthController } from "../controllers/OAuthController"
import { OAuthService } from "../services/OAuthService"
import { UserService } from "../services/UserService"
import { AuthService } from "../services/AuthService"
import { FastifyAuthMiddleware } from "../middleware/auth"
import { UserRepository } from "../repositories/UserRepository"

// Инициализируем сервисы и контроллер
const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const authService = new AuthService(userService)
const authMiddleware = new FastifyAuthMiddleware(authService)
const oauthService = new OAuthService(userService, authService)
const oauthController = new OAuthController(oauthService)

const oauthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Публичные роуты (не требуют аутентификации)

  // GET /auth/providers - получить список доступных провайдеров
  fastify.get("/providers", oauthController.getAvailableProviders)

  // GET /auth/:provider - инициировать OAuth поток
  fastify.get("/:provider", oauthController.initiateOAuth)

  // POST /auth/:provider/callback - обработать OAuth callback
  fastify.post("/:provider/callback", oauthController.handleOAuthCallback)

  // Защищенные роуты (требуют аутентификации)

  // POST /auth/link-social - привязать социальный аккаунт
  fastify.post(
    "/link-social",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    oauthController.linkSocialAccount,
  )

  // DELETE /auth/unlink-social - отвязать социальный аккаунт
  fastify.delete(
    "/unlink-social",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    oauthController.unlinkSocialAccount,
  )

  // GET /auth/social-accounts - получить список привязанных аккаунтов
  fastify.get(
    "/social-accounts",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    oauthController.getSocialAccounts,
  )
}

export default oauthRoutes
