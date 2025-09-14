import logger from "@marketplace/logger"
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
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({
        success: false,
        message: "Access token required",
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key"

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      verified: decoded.verified,
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.code(401).send({
        success: false,
        message: "Invalid access token",
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return reply.code(401).send({
        success: false,
        message: "Access token expired",
      })
    }

    logger.error("Auth middleware error:", error)
    return reply.code(500).send({
      success: false,
      message: "Authentication failed",
    })
  }
}

export const optionalAuthMiddleware = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return // Continue without authentication
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key"

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      verified: decoded.verified,
    }
  } catch (error) {
    logger.log("Optional auth error:", error)
    // If token is invalid, continue without authentication
  }
}

export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!request.user) {
    return reply.code(401).send({
      success: false,
      message: "Authentication required",
    })
  }

  if (request.user.role !== "admin" && request.user.role !== "agency_manager") {
    return reply.code(403).send({
      success: false,
      message: "Admin access required",
    })
  }
}
