import { Request, Response, NextFunction } from "express"
import { AuthService, TokenPayload } from "../services/AuthService"
import { UserRole } from "@marketplace/shared-types"

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export interface AuthMiddlewareOptions {
  requiredRoles?: UserRole[]
  optional?: boolean
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  // Main authentication middleware
  authenticate(options: AuthMiddlewareOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization
        const token = AuthService.extractTokenFromHeader(authHeader)

        if (!token) {
          if (options.optional) {
            return next()
          }
          return res.status(401).json({
            error: {
              code: "MISSING_TOKEN",
              message: "Access token is required",
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] || "unknown",
            },
          })
        }

        // Validate token
        const payload = await this.authService.validateAccessToken(token)
        req.user = payload

        // Check role requirements
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          if (!AuthService.hasRequiredRole(payload.role, options.requiredRoles)) {
            return res.status(403).json({
              error: {
                code: "INSUFFICIENT_PERMISSIONS",
                message: "Insufficient permissions for this resource",
                timestamp: new Date().toISOString(),
                requestId: req.headers["x-request-id"] || "unknown",
              },
            })
          }
        }

        next()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Authentication failed"

        return res.status(401).json({
          error: {
            code: "INVALID_TOKEN",
            message: errorMessage,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }
    }
  }

  // Convenience methods for common role checks
  requireAuth() {
    return this.authenticate()
  }

  requireAdmin() {
    return this.authenticate({ requiredRoles: [UserRole.ADMIN] })
  }

  requireManager() {
    return this.authenticate({
      requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
    })
  }

  requireAgency() {
    return this.authenticate({ requiredRoles: [UserRole.AGENCY] })
  }

  requireUser() {
    return this.authenticate({
      requiredRoles: [UserRole.USER, UserRole.AGENCY],
    })
  }

  optionalAuth() {
    return this.authenticate({ optional: true })
  }

  // Middleware to check if user can access specific resource
  requireOwnershipOrAdmin(getUserId: (req: Request) => string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      const resourceUserId = getUserId(req)
      const isOwner = req.user.userId === resourceUserId
      const isAdmin = AuthService.isAdmin(req.user.role)
      const isManager = AuthService.isManager(req.user.role)

      if (!isOwner && !isAdmin && !isManager) {
        return res.status(403).json({
          error: {
            code: "ACCESS_DENIED",
            message: "Access denied to this resource",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      next()
    }
  }

  // Middleware to validate request body against schema
  validateRequest(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body)
        next()
      } catch (error) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: error,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }
    }
  }
}

// Error handling middleware for authentication errors
export const authErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "unknown",
      },
    })
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Authentication token has expired",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "unknown",
      },
    })
  }

  next(error)
}
