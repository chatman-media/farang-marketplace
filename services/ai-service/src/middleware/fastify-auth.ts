import { FastifyRequest, FastifyReply } from "fastify"
import jwt from "jsonwebtoken"
import { env } from "../app"

export interface AuthenticatedUser {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  agencyId?: string
}

export interface JWTPayload {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  agencyId?: string
  iat: number
  exp: number
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
  interface FastifyInstance {
    authenticateToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAgencyStaff: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAgencyOwnership: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireResourceAccess: (resourceType: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    roleBasedRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

/**
 * Fastify plugin for authentication middleware
 */
export default async function authPlugin(fastify: any) {
  /**
   * Middleware to authenticate JWT tokens
   */
  fastify.decorate("authenticateToken", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization
      const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

      if (!token) {
        reply.status(401)
        return {
          success: false,
          message: "Access token required",
        }
      }

      if (!env.JWT_SECRET) {
        fastify.log.error("JWT_SECRET not configured")
        reply.status(500)
        return {
          success: false,
          message: "Server configuration error",
        }
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload
      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        ...(decoded.agencyId && { agencyId: decoded.agencyId }),
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        reply.status(401)
        return {
          success: false,
          message: "Token expired",
        }
      } else if (error instanceof jwt.JsonWebTokenError) {
        reply.status(401)
        return {
          success: false,
          message: "Invalid token",
        }
      } else {
        fastify.log.error("Authentication error:", error)
        reply.status(500)
        return {
          success: false,
          message: "Authentication failed",
        }
      }
    }
  })

  /**
   * Optional authentication middleware - doesn't fail if no token provided
   */
  fastify.decorate("optionalAuth", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization
      const token = authHeader && authHeader.split(" ")[1]

      if (!token) {
        // No token provided, continue without authentication
        return
      }

      if (!env.JWT_SECRET) {
        // Continue without authentication if JWT not configured
        return
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload
      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        ...(decoded.agencyId && { agencyId: decoded.agencyId }),
      }
    } catch (error) {
      // Continue without authentication if token is invalid
      return
    }
  })

  /**
   * Middleware to require admin role
   */
  fastify.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      reply.status(401)
      return {
        success: false,
        message: "Authentication required",
      }
    }

    if (request.user.role !== "admin") {
      reply.status(403)
      return {
        success: false,
        message: "Admin access required",
      }
    }
  })

  /**
   * Middleware to require agency staff role (owner or manager)
   */
  fastify.decorate("requireAgencyStaff", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      reply.status(401)
      return {
        success: false,
        message: "Authentication required",
      }
    }

    const allowedRoles = ["admin", "agency_owner", "agency_manager"]
    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403)
      return {
        success: false,
        message: "Agency staff access required",
      }
    }
  })

  /**
   * Middleware to require agency ownership
   */
  fastify.decorate("requireAgencyOwnership", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      reply.status(401)
      return {
        success: false,
        message: "Authentication required",
      }
    }

    // Admins can access any agency
    if (request.user.role === "admin") {
      return
    }

    // Check if user has agency role
    if (!["agency_owner", "agency_manager"].includes(request.user.role)) {
      reply.status(403)
      return {
        success: false,
        message: "Agency access required",
      }
    }

    // For agency-specific resources, check agency ownership
    const agencyId = (request.params as any)?.agencyId
    if (agencyId && request.user.agencyId !== agencyId) {
      reply.status(403)
      return {
        success: false,
        message: "Access denied: You can only access your own agency resources",
      }
    }
  })

  /**
   * Middleware to require resource access (user can access their own resources or admin can access any)
   */
  fastify.decorate("requireResourceAccess", (resourceType: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        reply.status(401)
        return {
          success: false,
          message: "Authentication required",
        }
      }

      // Admins can access any resource
      if (request.user.role === "admin") {
        return
      }

      // For user resources, check ownership
      if (resourceType === "user") {
        const userId = (request.params as any)?.userId
        if (userId && request.user.id !== userId) {
          reply.status(403)
          return {
            success: false,
            message: "Access denied: You can only access your own resources",
          }
        }
      }
    }
  })

  /**
   * Role-based rate limiting middleware
   */
  fastify.decorate("roleBasedRateLimit", async (request: FastifyRequest, reply: FastifyReply) => {
    // This is a placeholder - in a real implementation, you'd apply different
    // rate limits based on user role. For now, we'll just continue.
    return
  })
}
