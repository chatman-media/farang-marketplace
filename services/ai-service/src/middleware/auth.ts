import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: "user" | "admin" | "agency_owner" | "agency_manager"
    agencyId?: string
  }
}

export interface JWTPayload {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  agencyId?: string
  iat: number
  exp: number
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      })
      return
    }

    const jwtSecret = process.env["JWT_SECRET"]
    if (!jwtSecret) {
      console.error("JWT_SECRET not configured")
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      })
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.agencyId && { agencyId: decoded.agencyId }),
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired",
      })
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      })
    } else {
      console.error("Authentication error:", error)
      res.status(500).json({
        success: false,
        message: "Authentication failed",
      })
    }
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      // No token provided, continue without authentication
      next()
      return
    }

    const jwtSecret = process.env["JWT_SECRET"]
    if (!jwtSecret) {
      // Continue without authentication if JWT not configured
      next()
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.agencyId && { agencyId: decoded.agencyId }),
    }

    next()
  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    })
    return
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    })
    return
  }

  next()
}

/**
 * Middleware to require agency staff role (owner or manager)
 */
export const requireAgencyStaff = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    })
    return
  }

  const allowedRoles = ["admin", "agency_owner", "agency_manager"]
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "Agency staff access required",
    })
    return
  }

  next()
}

/**
 * Middleware to require agency ownership
 */
export const requireAgencyOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    })
    return
  }

  // Admins can access any agency
  if (req.user.role === "admin") {
    next()
    return
  }

  // Check if user has agency role
  if (!["agency_owner", "agency_manager"].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "Agency access required",
    })
    return
  }

  // Check if user belongs to the requested agency
  const requestedAgencyId = req.params["agencyId"] || req.body.agencyId || req.query["agencyId"]
  if (requestedAgencyId && req.user.agencyId !== requestedAgencyId) {
    res.status(403).json({
      success: false,
      message: "Access denied to this agency",
    })
    return
  }

  next()
}

/**
 * Middleware to check if user can access resource
 */
export const requireResourceAccess = (resourceType: "user" | "agency") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    // Admins can access everything
    if (req.user.role === "admin") {
      next()
      return
    }

    if (resourceType === "user") {
      // Users can only access their own resources
      const requestedUserId = req.params["userId"] || req.body.userId || req.query["userId"]
      if (requestedUserId && req.user.id !== requestedUserId) {
        res.status(403).json({
          success: false,
          message: "Access denied to this user resource",
        })
        return
      }
    } else if (resourceType === "agency") {
      // Agency staff can only access their own agency
      if (!["agency_owner", "agency_manager"].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: "Agency access required",
        })
        return
      }

      const requestedAgencyId = req.params["agencyId"] || req.body.agencyId || req.query["agencyId"]
      if (requestedAgencyId && req.user.agencyId !== requestedAgencyId) {
        res.status(403).json({
          success: false,
          message: "Access denied to this agency",
        })
        return
      }
    }

    next()
  }
}

/**
 * Middleware for rate limiting based on user role
 */
export const roleBasedRateLimit = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // In a real implementation, this would check rate limits based on user role
  // For now, just add rate limit info to response headers

  const rateLimits = {
    admin: { requests: 1000, window: 3600 },
    agency_owner: { requests: 500, window: 3600 },
    agency_manager: { requests: 300, window: 3600 },
    user: { requests: 100, window: 3600 },
  }

  const userRole = req.user?.role || "user"
  const limits = rateLimits[userRole]

  res.setHeader("X-RateLimit-Limit", limits.requests)
  res.setHeader("X-RateLimit-Window", limits.window)
  res.setHeader("X-RateLimit-Remaining", limits.requests - 1) // Mock remaining

  next()
}

/**
 * Generate JWT token for user
 */
export const generateToken = (user: {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  agencyId?: string
}): string => {
  const jwtSecret = process.env["JWT_SECRET"]
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured")
  }

  const expiresIn = process.env["JWT_EXPIRES_IN"] || "24h"

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
    },
    jwtSecret,
    { expiresIn } as jwt.SignOptions
  )
}

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const jwtSecret = process.env["JWT_SECRET"]
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured")
  }

  const expiresIn = process.env["JWT_REFRESH_EXPIRES_IN"] || "7d"

  return jwt.sign({ id: userId, type: "refresh" }, jwtSecret, {
    expiresIn,
  } as jwt.SignOptions)
}

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { id: string } => {
  const jwtSecret = process.env["JWT_SECRET"]
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured")
  }

  const decoded = jwt.verify(token, jwtSecret) as any

  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token")
  }

  return { id: decoded.id }
}

/**
 * Extract user ID from token without verification (for logging)
 */
export const extractUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any
    return decoded?.id || null
  } catch (error) {
    return null
  }
}
