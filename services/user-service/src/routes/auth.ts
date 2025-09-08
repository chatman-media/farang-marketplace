import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { AuthController } from "../controllers/AuthController"
import { AuthService } from "../services/AuthService"
import { UserService } from "../services/UserService"
import { UserRepository } from "../repositories/UserRepository"
import { FastifyAuthMiddleware } from "../middleware/auth"

// Initialize dependencies
const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const authService = new AuthService(userService)
const authController = new AuthController(authService)
const authMiddleware = new FastifyAuthMiddleware(authService)

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Public routes (no authentication required)
  fastify.post("/login", authController.login)
  fastify.post("/register", authController.register)
  fastify.post("/refresh", authController.refreshToken)
  fastify.post("/logout", authController.logout)

  // Protected routes (authentication required)
  fastify.get(
    "/profile",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    authController.getProfile,
  )

  fastify.post("/validate", authController.validateToken)
}

export default authRoutes
export { authService, authMiddleware }
