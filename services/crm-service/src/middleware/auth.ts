import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
    email?: string
  }
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Access token is required",
    })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    req.user = {
      id: decoded.id || decoded.userId,
      role: decoded.role || "user",
      email: decoded.email,
    }
    next()
  } catch (error) {
    res.status(403).json({
      error: "Forbidden",
      message: "Invalid or expired token",
    })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      })
      return
    }

    next()
  }
}
