import { Router } from 'express';
import { OAuthController } from '../controllers/OAuthController';
import { OAuthService } from '../services/OAuthService';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { AuthMiddleware } from '../middleware/auth';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();

// Инициализируем сервисы и контроллер
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const authService = new AuthService(userService);
const authMiddleware = new AuthMiddleware(authService);
const oauthService = new OAuthService(userService, authService);
const oauthController = new OAuthController(oauthService);

// Публичные роуты (не требуют аутентификации)

// GET /auth/providers - получить список доступных провайдеров
router.get('/providers', (req, res) =>
  oauthController.getAvailableProviders(req, res)
);

// GET /auth/:provider - инициировать OAuth поток
router.get('/:provider', (req, res) => oauthController.initiateOAuth(req, res));

// POST /auth/:provider/callback - обработать OAuth callback
router.post('/:provider/callback', (req, res) =>
  oauthController.handleOAuthCallback(req, res)
);

// Защищенные роуты (требуют аутентификации)

// POST /auth/link-social - привязать социальный аккаунт
router.post('/link-social', authMiddleware.requireAuth(), (req, res) =>
  oauthController.linkSocialAccount(req, res)
);

// DELETE /auth/unlink-social - отвязать социальный аккаунт
router.delete('/unlink-social', authMiddleware.requireAuth(), (req, res) =>
  oauthController.unlinkSocialAccount(req, res)
);

// GET /auth/social-accounts - получить список привязанных аккаунтов
router.get('/social-accounts', authMiddleware.requireAuth(), (req, res) =>
  oauthController.getSocialAccounts(req, res)
);

export default router;
