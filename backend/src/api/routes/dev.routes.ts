import { Router, Response } from 'express';
import { MockPhoneLogService } from '../../services/mockPhoneLog.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();
const mockPhoneService = new MockPhoneLogService();

// All dev routes require authentication
router.use(authenticate);

/**
 * POST /api/dev/sync-phone-logs
 * Manually trigger phone log sync for authenticated user
 */
router.post('/sync-phone-logs', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new AppError('User ID not found', 400);
  }
  
  const result = await mockPhoneService.syncUserPhoneLogs(req.userId);
  
  res.json({
    success: true,
    message: 'Phone logs synced successfully',
    data: result
  });
}));

/**
 * POST /api/dev/bulk-sync-phone-logs
 * Bulk sync phone logs for specified number of days
 */
router.post('/bulk-sync-phone-logs', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new AppError('User ID not found', 400);
  }
  
  const { days = 30 } = req.body;
  
  if (days < 1 || days > 365) {
    throw new AppError('Days must be between 1 and 365', 400);
  }
  
  const result = await mockPhoneService.bulkSync(req.userId, days);
  
  res.json({
    success: true,
    message: `Bulk phone logs synced for ${days} days`,
    data: result
  });
}));

/**
 * POST /api/dev/start-auto-sync
 * Start automatic phone log sync simulation
 */
router.post('/start-auto-sync', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new AppError('User ID not found', 400);
  }
  
  const { intervalMinutes = 60 } = req.body;
  
  mockPhoneService.startAutoSync([req.userId], intervalMinutes);
  
  res.json({
    success: true,
    message: `Auto-sync started with ${intervalMinutes} minute intervals`,
    data: mockPhoneService.getStats()
  });
}));

/**
 * POST /api/dev/stop-auto-sync
 * Stop automatic phone log sync simulation
 */
router.post('/stop-auto-sync', asyncHandler(async (_req: AuthRequest, res: Response) => {
  mockPhoneService.stopAutoSync();
  
  res.json({
    success: true,
    message: 'Auto-sync stopped',
    data: mockPhoneService.getStats()
  });
}));

/**
 * GET /api/dev/sync-stats
 * Get current sync statistics
 */
router.get('/sync-stats', asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: mockPhoneService.getStats()
  });
}));

export default router;