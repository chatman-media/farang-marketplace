import { Router } from "express"
import { AuthController } from "../controllers/AuthController"
import { AuthService } from "../services/AuthService"
import { UserService } from "../services/UserService"
import { UserRepository } from "../repositories/UserRepository"
import { AuthMiddleware } from "../middleware/auth"

// Create router
const router = Router()

// Initialize dependencies
const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const authService = new AuthService(userService)
const authController = new AuthController(authService)
const authMiddleware = new AuthMiddleware(authService)

// Public routes (no authentication required)
router.post("/login", authController.login)
router.post("/register", authController.register)
router.post("/refresh", authController.refreshToken)
router.post("/logout", authController.logout)

// Protected routes (authentication required)
router.get("/profile", authMiddleware.requireAuth(), authController.getProfile)
router.post("/validate", authController.validateToken)

export default router
export { authService, authMiddleware }
