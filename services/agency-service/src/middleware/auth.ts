import { FastifyRequest, FastifyReply } from "fastify"
import jwt from "jsonwebtoken"

export interface AuthenticatedUser {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  agencyId?: string
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

/**
 * JWT Authentication Middleware
 */
export async function authenticateToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (!token) {
    return reply.status(401).send({
      success: false,
      message: "Access token required",
    })
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable is not set")
    return reply.status(500).send({
      success: false,
      message: "Server configuration error",
    })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser
    request.user = decoded
  } catch (error) {
    console.error("JWT verification failed:", error)
    return reply.status(403).send({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: "Authentication required",
      })
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        message: "Insufficient permissions",
      })
    }
  }
}

/**
 * Agency ownership verification middleware
 */
export async function requireAgencyOwnership(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      message: "Authentication required",
    })
  }

  const agencyId = (request.params as any).agencyId || (request.body as any).agencyId

  // Admin can access any agency
  if (request.user.role === "admin") {
    return
  }

  // Agency owner/manager can only access their own agency
  if (request.user.role === "agency_owner" || request.user.role === "agency_manager") {
    if (request.user.agencyId === agencyId) {
      return
    }
  }

  return reply.status(403).send({
    success: false,
    message: "Access denied: You can only manage your own agency",
  })
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return // Continue without user
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return // Continue without user
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser
    request.user = decoded
  } catch (error) {
    // Invalid token, but continue without user
    console.warn("Invalid token in optional auth:", error)
  }
}

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole("admin")

/**
 * Agency staff middleware (owner or manager)
 */
export const requireAgencyStaff = requireRole("agency_owner", "agency_manager", "admin")

/**
 * Validate user ID matches authenticated user or admin
 */
export async function requireUserOrAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      message: "Authentication required",
    })
  }

  const userId = (request.params as any).userId || (request.body as any).userId

  if (request.user.role === "admin" || request.user.id === userId) {
    return
  }

  return reply.status(403).send({
    success: false,
    message: "Access denied: You can only access your own data",
  })
}
