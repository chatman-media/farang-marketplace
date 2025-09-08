import { FastifyRequest, FastifyReply } from "fastify"
import jwt from "jsonwebtoken"

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    role: string
    email?: string
  }
}

export const authenticateToken = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const authHeader = request.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return reply.code(401).send({
      error: "Unauthorized",
      message: "Access token is required",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    ;(request as AuthenticatedRequest).user = {
      id: decoded.id || decoded.userId,
      role: decoded.role || "user",
      email: decoded.email,
    }
  } catch (error) {
    return reply.code(403).send({
      error: "Forbidden",
      message: "Invalid or expired token",
    })
  }
}

export const requireRole = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authRequest = request as AuthenticatedRequest
    if (!authRequest.user) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      })
    }

    if (!roles.includes(authRequest.user.role)) {
      return reply.code(403).send({
        error: "Forbidden",
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      })
    }
  }
}

export type { AuthenticatedRequest }
