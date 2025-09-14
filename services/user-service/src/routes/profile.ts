import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ProfileController } from "../controllers/ProfileController"
import { FastifyAuthMiddleware } from "../middleware/auth"
import { UserRepository } from "../repositories/UserRepository"
import { UserService } from "../services/UserService"
import { authService } from "./auth"

// Initialize dependencies
const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const profileController = new ProfileController(userService)
const authMiddleware = new FastifyAuthMiddleware(authService)

const profileRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Profile management routes (all require authentication)
  fastify.get(
    "/",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.getProfile as any,
  )

  fastify.put(
    "/",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.updateProfile as any,
  )

  fastify.post(
    "/avatar",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.uploadAvatar as any,
  )

  // Verification routes
  fastify.post(
    "/verification/request",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.requestVerification as any,
  )

  // Admin/Manager routes for verification management
  fastify.post(
    "/verification/:userId/approve",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.approveVerification as any,
  )

  fastify.post(
    "/verification/:userId/reject",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.rejectVerification as any,
  )

  // Get user profile by ID (for admins/managers or own profile)
  fastify.get(
    "/:userId",
    {
      preHandler: [authMiddleware.requireAuth()],
    },
    profileController.getUserProfile as any,
  )
}

export default profileRoutes
