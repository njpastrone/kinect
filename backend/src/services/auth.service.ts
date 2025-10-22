import jwt from 'jsonwebtoken';
import { IAuthTokens } from '@kinect/shared';

export class AuthService {
  static generateTokens(userId: string): IAuthTokens {
    const secret = process.env.JWT_SECRET || 'secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

    // Access token valid for 1 hour - balances security with user experience
    const accessToken = jwt.sign({ userId }, secret, { expiresIn: '1h' });

    // Refresh token valid for 30 days - allows users to stay logged in
    const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '30d' });

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
