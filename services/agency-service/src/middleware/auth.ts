import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'agency_owner' | 'agency_manager';
  agencyId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * JWT Authentication Middleware
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): any {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Agency ownership verification middleware
 */
export function requireAgencyOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const agencyId = req.params.agencyId || req.body.agencyId;
  
  // Admin can access any agency
  if (req.user.role === 'admin') {
    return next();
  }

  // Agency owner/manager can only access their own agency
  if (req.user.role === 'agency_owner' || req.user.role === 'agency_manager') {
    if (req.user.agencyId === agencyId) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: You can only manage your own agency',
  });
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without user
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(); // Continue without user
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    req.user = decoded;
  } catch (error) {
    // Invalid token, but continue without user
    console.warn('Invalid token in optional auth:', error);
  }

  next();
}

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Agency staff middleware (owner or manager)
 */
export const requireAgencyStaff = requireRole('agency_owner', 'agency_manager', 'admin');

/**
 * Validate user ID matches authenticated user or admin
 */
export function requireUserOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const userId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'admin' || req.user.id === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: You can only access your own data',
  });
}
