import { AuthenticatedUser, UserRole } from "@marketplace/shared-types"
import { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"

interface JWTPayload {
  id: string
  email: string
  role: UserRole
  verified: boolean
  iat: number
  exp: number
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
  interface FastifyInstance {
    authenticate: typeof authMiddleware
    optionalAuthenticate: typeof optionalAuthMiddleware
  }
}

/**
 * Enforcing auth: rejects the request with 401 when no valid Bearer token is
 * present. Use as a per-route `preHandler` for protected endpoints.
 */
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      reply.code(401).send({
        error: "Unauthorized",
        message: "No token provided or invalid format",
        timestamp: new Date().toISOString(),
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token) {
      reply.code(401).send({
        error: "Unauthorized",
        message: "No token provided",
        timestamp: new Date().toISOString(),
      })
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      request.log.error("JWT_SECRET not configured")
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Authentication configuration error",
        timestamp: new Date().toISOString(),
      })
      return
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload

      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        verified: decoded.verified,
      }
    } catch (jwtError: any) {
      if (jwtError.name === "TokenExpiredError") {
        reply.code(401).send({
          error: "Unauthorized",
          message: "Token has expired",
          timestamp: new Date().toISOString(),
        })
        return
      }

      if (jwtError.name === "JsonWebTokenError") {
        reply.code(401).send({
          error: "Unauthorized",
          message: "Invalid token",
          timestamp: new Date().toISOString(),
        })
        return
      }

      request.log.error("JWT verification error:", jwtError)
      reply.code(401).send({
        error: "Unauthorized",
        message: "Token verification failed",
        timestamp: new Date().toISOString(),
      })
      return
    }
  } catch (error: any) {
    request.log.error("Authentication middleware error:", error)
    reply.code(500).send({
      error: "Internal Server Error",
      message: "Authentication failed",
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Non-enforcing auth: populates `request.user` when a valid Bearer token is
 * present, and is a no-op otherwise. Register once as a global `onRequest`
 * hook so every handler can opportunistically read `request.user`.
 */
export const optionalAuthMiddleware = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return
    }

    const token = authHeader.substring(7)
    if (!token) {
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      request.log.error("JWT_SECRET not configured")
      return
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload
      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        verified: decoded.verified,
      }
    } catch (jwtError: any) {
      request.log.warn("Optional auth failed:", jwtError)
    }
  } catch (error: any) {
    request.log.error("Optional authentication middleware error:", error)
  }
}

/** Per-route guard that requires the authenticated user to hold one of `allowedRoles`. */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({
        error: "Unauthorized",
        message: "Authentication required",
        timestamp: new Date().toISOString(),
      })
      return
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.code(403).send({
        error: "Forbidden",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }
}

/** Per-route guard that requires the authenticated user to be verified. */
export const requireVerified = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!request.user) {
    reply.code(401).send({
      error: "Unauthorized",
      message: "Authentication required",
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (!request.user.verified) {
    reply.code(403).send({
      error: "Forbidden",
      message: "Account verification required",
      timestamp: new Date().toISOString(),
    })
    return
  }
}

// Convenience guards
export const adminOnly = requireRole([UserRole.ADMIN])
export const managerOrAdmin = requireRole([UserRole.AGENCY_MANAGER, UserRole.ADMIN])
