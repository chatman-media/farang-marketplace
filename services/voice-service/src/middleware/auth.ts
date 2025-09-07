import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"

interface JWTPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Access token required",
    })
    return
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured")
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    console.error("Token verification error:", error)
    res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    })
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

  if (!token) {
    next()
    return
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      next()
      return
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    // Ignore token errors for optional auth
    console.warn("Optional auth token error:", error)
  }

  next()
}

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      })
      return
    }

    next()
  }
}

/**
 * Rate limiting middleware for voice requests
 */
export const voiceRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.user?.id || req.ip || "anonymous"
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
      next()
      return
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
      })
      return
    }

    userRequests.count++
    next()
  }
}

/**
 * Audio file validation middleware
 */
export const validateAudioFile = (req: Request, res: Response, next: NextFunction): void => {
  const file = req.file

  if (!file) {
    res.status(400).json({
      success: false,
      error: "Audio file is required",
    })
    return
  }

  // Check file size
  const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10) // 10MB default
  if (file.size > maxSize) {
    res.status(400).json({
      success: false,
      error: `File too large. Maximum size: ${maxSize} bytes`,
    })
    return
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

  if (!allowedMimeTypes.includes(file.mimetype)) {
    res.status(400).json({
      success: false,
      error: "Unsupported audio format",
      supportedFormats: allowedMimeTypes,
    })
    return
  }

  next()
}

/**
 * Request validation middleware
 */
export const validateVoiceRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { audioData, text, language } = req.body

  // Must have either audio data or text
  if (!audioData && !text) {
    res.status(400).json({
      success: false,
      error: "Either audioData or text is required",
    })
    return
  }

  // Validate language if provided
  if (language && typeof language !== "string") {
    res.status(400).json({
      success: false,
      error: "Language must be a string",
    })
    return
  }

  // Validate audio data if provided
  if (audioData) {
    if (typeof audioData !== "string" && !Buffer.isBuffer(audioData)) {
      res.status(400).json({
        success: false,
        error: "Audio data must be a base64 string or buffer",
      })
      return
    }

    // Check audio data size
    const audioSize =
      typeof audioData === "string" ? Buffer.from(audioData, "base64").length : audioData.length

    const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10)
    if (audioSize > maxSize) {
      res.status(400).json({
        success: false,
        error: `Audio data too large. Maximum size: ${maxSize} bytes`,
      })
      return
    }
  }

  // Validate text if provided
  if (text && typeof text !== "string") {
    res.status(400).json({
      success: false,
      error: "Text must be a string",
    })
    return
  }

  next()
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Voice service error:", error)

  // Handle specific error types
  if (error.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    })
    return
  }

  if (error.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: "Token expired",
    })
    return
  }

  if (error.name === "MulterError") {
    res.status(400).json({
      success: false,
      error: "File upload error",
      details: error.message,
    })
    return
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: error.message }),
  })
}
