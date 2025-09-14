import { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"

import { env } from "../config/environment.js"

export interface JWTPayload {
  id: string
  email: string
  role: string
  agencyId?: string
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends Omit<FastifyRequest, "user"> {
  user?: JWTPayload
}

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/health",
  "/metrics",
  "/services",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/listings", // Public listing browsing
  "/api/real-estate", // Public real estate browsing
  "/api/service-providers", // Public service provider browsing
]

// Routes that require specific roles
const roleBasedRoutes: Record<string, string[]> = {
  "/api/admin/*": ["admin"],
  "/api/agencies/*/manage": ["admin", "agency_owner", "agency_manager"],
  "/api/crm/*": ["admin", "agency_owner", "agency_manager"],
  "/api/campaigns/*": ["admin", "agency_owner", "agency_manager"],
}

export function isPublicRoute(path: string): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith("*")) {
      return path.startsWith(route.slice(0, -1))
    }
    return path === route || path.startsWith(`${route}/`)
  })
}

export function getRequiredRoles(path: string): string[] | null {
  for (const [routePattern, roles] of Object.entries(roleBasedRoutes)) {
    if (routePattern.includes("*")) {
      // Convert pattern to regex
      const regexPattern = routePattern
        .replace(/\*/g, "[^/]+") // Replace * with one or more non-slash characters
        .replace(/\//g, "\\/") // Escape slashes
      const regex = new RegExp(`^${regexPattern}$`)

      if (regex.test(path)) {
        return roles
      }
    } else if (path === routePattern) {
      return roles
    }
  }
  return null
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const path = request.url.split("?")[0] // Remove query parameters

  // Skip authentication for public routes
  if (isPublicRoute(path)) {
    return
  }

  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({
        success: false,
        error: "MISSING_TOKEN",
        message: "Access token required",
        timestamp: new Date().toISOString(),
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!env.JWT_SECRET) {
      request.log.error("JWT_SECRET not configured")
      return reply.code(500).send({
        success: false,
        error: "SERVER_ERROR",
        message: "Authentication service unavailable",
        timestamp: new Date().toISOString(),
      })
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload

    // Add user info to request
    ;(request as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.agencyId && { agencyId: decoded.agencyId }),
    }

    // Check role-based access
    const requiredRoles = getRequiredRoles(path)
    if (requiredRoles && !requiredRoles.includes(decoded.role)) {
      return reply.code(403).send({
        success: false,
        error: "INSUFFICIENT_PERMISSIONS",
        message: `Access denied. Required roles: ${requiredRoles.join(", ")}`,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return reply.code(401).send({
        success: false,
        error: "TOKEN_EXPIRED",
        message: "Access token has expired",
        timestamp: new Date().toISOString(),
      })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({
        success: false,
        error: "INVALID_TOKEN",
        message: "Invalid access token",
        timestamp: new Date().toISOString(),
      })
    }
    request.log.error("Authentication error: %s", String(error))
    return reply.code(500).send({
      success: false,
      error: "AUTH_ERROR",
      message: "Authentication failed",
      timestamp: new Date().toISOString(),
    })
  }
}

// Optional authentication middleware - doesn't fail if no token provided
export async function optionalAuthMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without authentication
      return
    }

    const token = authHeader.substring(7)

    if (!env.JWT_SECRET) {
      // Continue without authentication if JWT not configured
      return
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload

    ;(request as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.agencyId && { agencyId: decoded.agencyId }),
    }
  } catch {
    // Continue without authentication if token is invalid
    // This allows the request to proceed but without user context
    return
  }
}

// Middleware to extract and validate API keys for external integrations
export async function apiKeyMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const apiKey = request.headers["x-api-key"] as string

  if (!apiKey) {
    return reply.code(401).send({
      success: false,
      error: "MISSING_API_KEY",
      message: "API key required",
      timestamp: new Date().toISOString(),
    })
  }

  // TODO: Implement API key validation logic
  // This could involve checking against a database or external service

  // For now, we'll just check against environment variables
  const validApiKeys = process.env.VALID_API_KEYS?.split(",") || []

  if (!validApiKeys.includes(apiKey)) {
    return reply.code(401).send({
      success: false,
      error: "INVALID_API_KEY",
      message: "Invalid API key",
      timestamp: new Date().toISOString(),
    })
  }
}

// Role checking utility
export function hasRole(user: JWTPayload | undefined, requiredRoles: string[]): boolean {
  if (!user) return false
  return requiredRoles.includes(user.role)
}

// Agency access checking utility
export function hasAgencyAccess(user: JWTPayload | undefined, agencyId: string): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  return user.agencyId === agencyId
}
