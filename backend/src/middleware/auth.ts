import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}

// Admin role check middleware
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }
}
