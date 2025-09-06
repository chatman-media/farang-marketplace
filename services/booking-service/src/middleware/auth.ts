import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'guest' | 'host' | 'admin';
        verified: boolean;
      };
    }
  }
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
  verified: boolean;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided or invalid format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Server configuration error',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Validate required fields
      if (!decoded.id || !decoded.email || !decoded.role) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token payload',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Add user to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        verified: decoded.verified || false,
      };

      next();
    } catch (jwtError: any) {
      let message = 'Invalid token';

      if (jwtError.name === 'TokenExpiredError') {
        message = 'Token has expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Invalid token format';
      } else if (jwtError.name === 'NotBeforeError') {
        message = 'Token not active yet';
      }

      res.status(401).json({
        error: 'Unauthorized',
        message,
        timestamp: new Date().toISOString(),
      });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      if (decoded.id && decoded.email && decoded.role) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          verified: decoded.verified || false,
        };
      }
    } catch (jwtError) {
      // Invalid token, but continue without user
      console.warn('Invalid token in optional auth:', jwtError);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

// Verified user middleware
export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!req.user.verified) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Account verification required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

// Admin only middleware
export const adminOnly = requireRole(['admin']);

// Host or admin middleware
export const hostOrAdmin = requireRole(['host', 'admin']);
