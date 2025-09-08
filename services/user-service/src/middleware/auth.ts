import { FastifyRequest, FastifyReply } from "fastify"
import { AuthService, TokenPayload } from "../services/AuthService"
import { UserRole } from "@marketplace/shared-types"

// Extend Fastify Request interface to include user data
declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload
  }
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
          return reply.code(401).send({
            error: {
              code: "MISSING_TOKEN",
              message: "Access token is required",
              timestamp: new Date().toISOString(),
              requestId: request.headers["x-request-id"] || "unknown",
            },
          })
        }

        // Validate token
        const payload = await this.authService.validateAccessToken(token)
        request.user = payload

        // Check role requirements
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          if (!AuthService.hasRequiredRole(payload.role, options.requiredRoles)) {
            return reply.code(403).send({
              error: {
                code: "INSUFFICIENT_PERMISSIONS",
                message: `Required roles: ${options.requiredRoles.join(", ")}`,
                timestamp: new Date().toISOString(),
                requestId: request.headers["x-request-id"] || "unknown",
              },
            })
          }
        }
      } catch (error) {
        if (options.optional) {
          return
        }

        if (error instanceof Error) {
          return reply.code(401).send({
            error: {
              code: "INVALID_TOKEN",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: request.headers["x-request-id"] || "unknown",
            },
          })
        }

        return reply.code(500).send({
          error: {
            code: "AUTH_ERROR",
            message: "Authentication failed",
            timestamp: new Date().toISOString(),
            requestId: request.headers["x-request-id"] || "unknown",
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
    return this.authenticate({ requiredRoles: [UserRole.ADMIN, UserRole.MANAGER] })
  }
}

// Error handler for authentication errors
export const authErrorHandler = async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
  if (error.name === "UnauthorizedError" || error.message.includes("token")) {
    return reply.code(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }

  if (error.name === "ForbiddenError") {
    return reply.code(403).send({
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
