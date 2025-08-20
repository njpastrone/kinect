import jwt from 'jsonwebtoken';
import { IAuthTokens } from '@kinect/shared';

export class AuthService {
  static generateTokens(userId: string): IAuthTokens {
    const secret = process.env.JWT_SECRET || 'secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

    const accessToken = jwt.sign({ userId }, secret, { expiresIn: '15m' });

    const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): { userId: string } {
    const secret = process.env.JWT_SECRET || 'secret';
    return jwt.verify(token, secret) as { userId: string };
  }

  static verifyRefreshToken(token: string): { userId: string } {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    return jwt.verify(token, refreshSecret) as { userId: string };
  }
}
