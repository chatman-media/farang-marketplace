import { logger } from "@marketplace/logger"

import type { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"

interface JWTPayload {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  iat: number
  exp: number
}

interface AuthenticatedUser {
  id: string
  email: string
  role: "user" | "admin" | "agency_owner" | "agency_manager"
  agencyId?: string
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
  interface FastifyInstance {
    authenticateToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    voiceRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    validateVoiceRequest: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    validateAudioFile: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
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
        reply.code(401)
        return {
          success: false,
          message: "Access token required",
        }
      }

      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        fastify.log.error("JWT_SECRET not configured")
        reply.code(500)
        return {
          success: false,
          message: "Server configuration error",
        }
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload
      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }
      // Authentication successful
      return
    } catch (error) {
      fastify.log.error("Token verification error:", error)
      reply.code(403)
      return {
        success: false,
        message: "Invalid or expired token",
      }
    }
  })

  /**
   * Optional authentication middleware - doesn't fail if no token provided
   */
  fastify.decorate("optionalAuth", async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization
      const token = authHeader && authHeader.split(" ")[1]

      if (!token) {
        // No token provided, continue without authentication
        return
      }

      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        // Continue without authentication if JWT not configured
        return
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload
      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }
    } catch (error) {
      logger.error("Token verification error:", error)
      // Continue without authentication if token is invalid
      return
    }
  })

  /**
   * Role-based authorization middleware
   */
  fastify.decorate("requireRole", (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        reply.code(401)
        return {
          success: false,
          message: "Authentication required",
        }
      }

      if (!roles.includes(request.user.role)) {
        reply.code(403)
        return {
          success: false,
          message: "Insufficient permissions",
        }
      }
      // Authorization successful
      return
    }
  })

  /**
   * Rate limiting middleware for voice requests
   */
  const requests = new Map<string, { count: number; resetTime: number }>()

  fastify.decorate("voiceRateLimit", async (request: FastifyRequest, reply: FastifyReply) => {
    const maxRequests = 100
    const windowMs = 60000 // 1 minute
    const identifier = request.user?.id || request.ip || "anonymous"
    const now = Date.now()

    // Clean up expired entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key)
      }
    }

    const userRequests = requests.get(identifier)

    if (!userRequests) {
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })
      return
    }

    if (userRequests.count >= maxRequests) {
      reply.code(429)
      return {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
      }
    }

    userRequests.count++
    // Rate limit check passed
    return
  })

  /**
   * Audio file validation middleware
   */
  fastify.decorate("validateAudioFile", async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await (request as any).file()

    if (!data) {
      reply.code(400)
      return {
        success: false,
        error: "Audio file is required",
      }
    }

    // Check file size
    const maxSize = Number.parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10) // 10MB default
    const buffer = await data.toBuffer()

    if (buffer.length > maxSize) {
      reply.code(400)
      return {
        success: false,
        error: `File too large. Maximum size: ${maxSize} bytes`,
      }
    }

    // Check file type
    const allowedMimeTypes = [
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/flac",
      "audio/ogg",
      "audio/webm",
      "audio/m4a",
      "audio/x-m4a",
    ]

    if (!allowedMimeTypes.includes(data.mimetype)) {
      reply.code(400)
      return {
        success: false,
        error: "Unsupported audio format",
        supportedFormats: allowedMimeTypes,
      }
    }
    // Store the buffer for later use
    ;(request as any).fileBuffer = buffer
    ;(request as any).fileInfo = {
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
    }

    // Validation successful
    return
  })

  /**
   * Request validation middleware
   */
  fastify.decorate("validateVoiceRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const { audioData, text, language } = request.body as any

    // Must have either audio data or text
    if (!audioData && !text) {
      reply.code(400)
      return {
        success: false,
        error: "Either audioData or text is required",
      }
    }

    // Validate language if provided
    if (language && typeof language !== "string") {
      reply.code(400)
      return {
        success: false,
        error: "Language must be a string",
      }
    }

    // Validate audio data if provided
    if (audioData) {
      if (typeof audioData !== "string" && !Buffer.isBuffer(audioData)) {
        reply.code(400)
        return {
          success: false,
          error: "Audio data must be a base64 string or buffer",
        }
      }

      // Check audio data size
      const audioSize = typeof audioData === "string" ? Buffer.from(audioData, "base64").length : audioData.length

      const maxSize = Number.parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10)
      if (audioSize > maxSize) {
        reply.code(400)
        return {
          success: false,
          error: `Audio data too large. Maximum size: ${maxSize} bytes`,
        }
      }
    }

    // Validate text if provided
    if (text && typeof text !== "string") {
      reply.code(400)
      return {
        success: false,
        error: "Text must be a string",
      }
    }

    // Validation passed
    return
  })
}

/**
 * Error handling middleware
 */
export const errorHandler = (error: Error, _req: FastifyRequest, reply: FastifyReply): void => {
  logger.error("Voice service error:", error)

  // Handle specific error types
  if (error.name === "JsonWebTokenError") {
    reply.code(401)
    reply.send({
      success: false,
      error: "Invalid token",
    })
    return
  }

  if (error.name === "TokenExpiredError") {
    reply.code(401)
    reply.send({
      success: false,
      error: "Token expired",
    })
    return
  }

  if (error.name === "MulterError") {
    reply.code(400)
    reply.send({
      success: false,
      error: "File upload error",
      details: error.message,
    })
    return
  }

  // Default error response
  reply.code(500)
  reply.send({
    success: false,
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: error.message }),
  })
}
