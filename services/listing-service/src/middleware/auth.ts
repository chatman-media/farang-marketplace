import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

interface JWTPayload {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key"

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
      })
    }

    console.error("Auth middleware error:", error)
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    })
  }
}

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next() // Continue without authentication
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key"

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    console.log("Optional auth error:", error)
    // If token is invalid, continue without authentication
    next()
  }
}

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    })
  }

  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    })
  }

  next()
}
