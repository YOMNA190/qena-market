import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getUserNotifications(req.user!.userId, {
      page,
      limit,
      unreadOnly,
    });

    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      meta: result.meta,
    });
  })
);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAsRead(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.userId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.deleteNotification(
      req.params.id,
      req.user!.userId
    );

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// Admin routes

// @route   POST /api/notifications/admin/broadcast
// @desc    Send broadcast notification (admin)
// @access  Private (Admin)
router.post(
  '/admin/broadcast',
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userIds, title, message, data, type } = req.body;

    const result = await notificationService.createBulkNotifications({
      userIds,
      type,
      title,
      message,
      data,
    });

    res.json({
      success: true,
      message: `تم إرسال الإشعار إلى ${result.count} مستخدم`,
      data: result,
    });
  })
);

export default router;
