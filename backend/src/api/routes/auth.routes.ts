import { Router } from 'express';
import { User } from '../../models/User.model';
import { AuthService } from '../../services/auth.service';
import { authValidation, validate } from '../../utils/validation';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.post('/register', validate(authValidation.register), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists', 409);
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName
  });

  const tokens = AuthService.generateTokens(user._id.toString());

  res.status(201).json({
    success: true,
    data: {
      user: user.toJSON(),
      tokens
    }
  });
}));

router.post('/login', validate(authValidation.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const tokens = AuthService.generateTokens(user._id.toString());

  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      tokens
    }
  });
}));

router.post('/refresh', validate(authValidation.refreshToken), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = AuthService.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const tokens = AuthService.generateTokens(user._id.toString());

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        tokens
      }
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}));

export default router;