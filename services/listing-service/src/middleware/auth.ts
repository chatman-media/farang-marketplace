import { FastifyRequest, FastifyReply } from "fastify"
import jwt from "jsonwebtoken"

interface JWTPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      role: string
    }
  }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
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
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.status(401).send({
        success: false,
        message: "Invalid access token",
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({
        success: false,
        message: "Access token expired",
      })
    }

    console.error("Auth middleware error:", error)
    return reply.status(500).send({
      success: false,
      message: "Authentication failed",
    })
  }
}

export const optionalAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
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
    }
  } catch (error) {
    console.log("Optional auth error:", error)
    // If token is invalid, continue without authentication
  }
}

export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      message: "Authentication required",
    })
  }

  if (request.user.role !== "admin" && request.user.role !== "manager") {
    return reply.status(403).send({
      success: false,
      message: "Admin access required",
    })
  }
}
