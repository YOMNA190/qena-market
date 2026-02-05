import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate, userValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  })
);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  validate(userValidations.updateProfile),
  asyncHandler(async (req: Request, res: Response) => {
    const { fullName, phone, avatar } = req.body;

    const user = await userService.updateProfile(req.user!.userId, {
      fullName,
      phone,
      avatar,
    });

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: user,
    });
  })
);

// @route   GET /api/users/addresses
// @desc    Get user addresses
// @access  Private
router.get(
  '/addresses',
  asyncHandler(async (req: Request, res: Response) => {
    const addresses = await userService.getAddresses(req.user!.userId);

    res.json({
      success: true,
      data: addresses,
    });
  })
);

// @route   POST /api/users/addresses
// @desc    Create new address
// @access  Private
router.post(
  '/addresses',
  validate(userValidations.createAddress),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await userService.createAddress(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'تم إضافة العنوان بنجاح',
      data: address,
    });
  })
);

// @route   GET /api/users/addresses/:id
// @desc    Get address by ID
// @access  Private
router.get(
  '/addresses/:id',
  validate([commonValidations.id]),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await userService.getAddressById(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: address,
    });
  })
);

// @route   PUT /api/users/addresses/:id
// @desc    Update address
// @access  Private
router.put(
  '/addresses/:id',
  validate(userValidations.updateAddress),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await userService.updateAddress(
      req.params.id,
      req.user!.userId,
      req.body
    );

    res.json({
      success: true,
      message: 'تم تحديث العنوان بنجاح',
      data: address,
    });
  })
);

// @route   DELETE /api/users/addresses/:id
// @desc    Delete address
// @access  Private
router.delete(
  '/addresses/:id',
  validate([commonValidations.id]),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.deleteAddress(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get(
  '/notifications',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await userService.getNotifications(req.user!.userId, {
      page,
      limit,
      unreadOnly,
    });

    res.json({
      success: true,
      data: result.notifications,
      meta: result.meta,
    });
  })
);

// @route   GET /api/users/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get(
  '/notifications/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.getUnreadNotificationsCount(req.user!.userId);

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   PATCH /api/users/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch(
  '/notifications/:id/read',
  validate([commonValidations.id]),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.markNotificationAsRead(
      req.params.id,
      req.user!.userId
    );

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   PATCH /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch(
  '/notifications/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.markAllNotificationsAsRead(req.user!.userId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   GET /api/users/favorites
// @desc    Get user favorites
// @access  Private
router.get(
  '/favorites',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.getFavorites(req.user!.userId, { page, limit });

    res.json({
      success: true,
      data: result.favorites,
      meta: result.meta,
    });
  })
);

// @route   POST /api/users/favorites
// @desc    Add to favorites
// @access  Private
router.post(
  '/favorites',
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.body;

    const favorite = await userService.addToFavorites(req.user!.userId, productId);

    res.status(201).json({
      success: true,
      message: 'تم إضافة المنتج إلى المفضلة',
      data: favorite,
    });
  })
);

// @route   DELETE /api/users/favorites/:productId
// @desc    Remove from favorites
// @access  Private
router.delete(
  '/favorites/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.removeFromFavorites(
      req.user!.userId,
      req.params.productId
    );

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   GET /api/users/favorites/:productId/check
// @desc    Check if product is in favorites
// @access  Private
router.get(
  '/favorites/:productId/check',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.isInFavorites(
      req.user!.userId,
      req.params.productId
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
