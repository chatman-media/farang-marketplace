import { AuthenticatedUser, UserRole } from "@marketplace/shared-types"
import { FastifyReply, FastifyRequest } from "fastify"

import { AuthService } from "../services/AuthService"

// Define UserServiceAuthenticatedUser type for user-service with additional fields
export interface UserServiceAuthenticatedUser extends AuthenticatedUser {
  userId: string
  type: "access" | "refresh"
}

// Type for requests with authenticated user
export type AuthenticatedRequest = FastifyRequest & {
  user: UserServiceAuthenticatedUser
}

export interface AuthMiddlewareOptions {
  requiredRoles?: UserRole[]
  optional?: boolean
}

export class FastifyAuthMiddleware {
  constructor(private authService: AuthService) {}

  // Main authentication middleware
  authenticate(options: AuthMiddlewareOptions = {}) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization
        const token = AuthService.extractTokenFromHeader(authHeader)

        if (!token) {
          if (options.optional) {
            return
          }
          return reply.status(401).send({
            error: {
              code: "MISSING_TOKEN",
              message: "Access token is required",
              timestamp: new Date().toISOString(),
              requestId:
                request.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
          })
        }

        // Validate token
        const payload = await this.authService.validateAccessToken(token)
        ;(request as any).user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          type: payload.type,
        } as UserServiceAuthenticatedUser

        // Check role requirements
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          if (!AuthService.hasRequiredRole(payload.role, options.requiredRoles)) {
            return reply.status(403).send({
              error: {
                code: "INSUFFICIENT_PERMISSIONS",
                message: `Required roles: ${options.requiredRoles.join(", ")}`,
                timestamp: new Date().toISOString(),
                requestId:
                  request.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              },
            })
          }
        }
      } catch (error) {
        if (options.optional) {
          return
        }

        if (error instanceof Error) {
          return reply.status(401).send({
            error: {
              code: "INVALID_TOKEN",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId:
                request.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
          })
        }

        return reply.status(500).send({
          error: {
            code: "AUTH_ERROR",
            message: "Authentication failed",
            timestamp: new Date().toISOString(),
            requestId:
              request.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }
    }
  }

  // Convenience methods
  requireAuth(requiredRoles?: UserRole[]) {
    return this.authenticate({ requiredRoles })
  }

  optionalAuth() {
    return this.authenticate({ optional: true })
  }

  requireRole(roles: UserRole[]) {
    return this.authenticate({ requiredRoles: roles })
  }

  requireAdmin() {
    return this.authenticate({ requiredRoles: [UserRole.ADMIN] })
  }

  requireManager() {
    return this.authenticate({ requiredRoles: [UserRole.ADMIN, UserRole.AGENCY_MANAGER] })
  }
}

// Error handler for authentication errors
export const authErrorHandler = async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
  if (error.name === "UnauthorizedError" || error.message.includes("token")) {
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }

  if (error.name === "ForbiddenError") {
    return reply.status(403).send({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }

  // Re-throw other errors to be handled by global error handler
  throw error
}
