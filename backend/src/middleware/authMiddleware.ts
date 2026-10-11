import type { Request, Response, NextFunction } from 'express';
import type {} from 'multer';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    businessId: string;
    role: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET || 'fallback_access_secret') as any;
    req.user = {
      userId: payload.userId,
      businessId: payload.businessId,
      role: payload.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};
