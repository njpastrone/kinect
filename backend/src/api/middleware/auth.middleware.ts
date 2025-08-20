import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const decoded = AuthService.verifyAccessToken(token);
    req.userId = decoded.userId;
    next();
  } catch (_error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
