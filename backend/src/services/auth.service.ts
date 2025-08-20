import jwt from 'jsonwebtoken';
import { IUser, IAuthTokens } from '@kinect/shared';

export class AuthService {
  static generateTokens(userId: string): IAuthTokens {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
  }

  static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as { userId: string };
  }
}