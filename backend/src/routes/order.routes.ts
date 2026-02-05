import { Router, Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { authorizeAdmin, authenticate } from '../middleware/auth.middleware';
import { validate, orderValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await orderService.getUserOrders(req.user!.userId, {
      page,
      limit,
      status,
    });

    res.json({
      success: true,
      data: result.orders,
      meta: result.meta,
    });
  })
);

// @route   POST /api/orders
// @desc    Create order
// @access  Private
router.post(
  '/',
  validate(orderValidations.createOrder),
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.createOrder(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: orders,
    });
  })
);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get(
  '/:id',
  validate([commonValidations.id]),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: order,
    });
  })
);

// @route   PATCH /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.patch(
  '/:id/cancel',
  validate([commonValidations.id]),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.cancelOrder(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: order,
    });
  })
);

// Admin routes

// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin)
// @access  Private (Admin)
router.get(
  '/admin/all',
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const shopId = req.query.shopId as string;
    const userId = req.query.userId as string;

    const result = await orderService.getAllOrders({
      page,
      limit,
      status,
      shopId,
      userId,
    });

    res.json({
      success: true,
      data: result.orders,
      meta: result.meta,
    });
  })
);

// @route   GET /api/orders/admin/statistics
// @desc    Get order statistics (admin)
// @access  Private (Admin)
router.get(
  '/admin/statistics',
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// @route   PATCH /api/orders/admin/:id/status
// @desc    Update order status (admin)
// @access  Private (Admin)
router.patch(
  '/admin/:id/status',
  authorizeAdmin,
  validate(orderValidations.updateOrderStatus),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(req.params.id, status);

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      data: order,
    });
  })
);

export default router;
