import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../../models/User.model';
import { AuthService } from '../../services/auth.service';
import { authValidation, validate } from '../../utils/validation';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { emailService } from '../../services/email.service';

const router = Router();

router.post(
  '/register',
  validate(authValidation.register),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    const tokens = AuthService.generateTokens(user._id?.toString() || '');

    // Send welcome email (don't wait for it to complete)
    emailService.sendWelcomeEmail(user.toJSON() as any).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        tokens,
      },
    });
  })
);

router.post(
  '/login',
  validate(authValidation.login),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = AuthService.generateTokens(user._id?.toString() || '');

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        tokens,
      },
    });
  })
);

router.post(
  '/refresh',
  validate(authValidation.refreshToken),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
      const decoded = AuthService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const tokens = AuthService.generateTokens(user._id?.toString() || '');

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          tokens,
        },
      });
    } catch (_error) {
      throw new AppError('Invalid refresh token', 401);
    }
  })
);

// Get current user profile
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  })
);

// Forgot password
router.post(
  '/forgot-password',
  validate(authValidation.forgotPassword),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists
      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    try {
      await emailService.sendPasswordResetEmail(user.toJSON() as any, resetToken);
    } catch (emailError) {
      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      console.error('Failed to send password reset email:', emailError);
      throw new AppError('Failed to send reset email', 500);
    }

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  })
);

// Reset password
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new tokens for immediate login
    const tokens = AuthService.generateTokens(user._id?.toString() || '');

    res.json({
      success: true,
      message: 'Password reset successful',
      data: {
        user: user.toJSON(),
        tokens,
      },
    });
  })
);

export default router;
