import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authorizeAdmin, authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { analyticsService } from '../services/analytics.service';
import { orderService } from '../services/order.service';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorizeAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await analyticsService.getAdminDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user status
// @access  Private (Admin)
router.patch(
  '/users/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
      },
    });

    res.json({
      success: true,
      message: 'تم تحديث حالة المستخدم بنجاح',
      data: user,
    });
  })
);

// @route   GET /api/admin/vendors/pending
// @desc    Get pending vendors
// @access  Private (Admin)
router.get(
  '/vendors/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      success: true,
      data: vendors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// @route   GET /api/admin/shops/pending
// @desc    Get pending shops
// @access  Private (Admin)
router.get(
  '/shops/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where: { status: 'PENDING' },
        include: {
          vendor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              nameAr: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      success: true,
      data: shops,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// @route   GET /api/admin/products
// @desc    Get all products (admin)
// @access  Private (Admin)
router.get(
  '/products',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isActive = req.query.isActive === 'true' ? true : 
                     req.query.isActive === 'false' ? false : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          category: {
            select: {
              id: true,
              nameAr: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// @route   GET /api/admin/orders/statistics
// @desc    Get order statistics
// @access  Private (Admin)
router.get(
  '/orders/statistics',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// @route   GET /api/admin/analytics/sales
// @desc    Get sales chart data
// @access  Private (Admin)
router.get(
  '/analytics/sales',
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const data = await analyticsService.getSalesChartData(undefined, days);

    res.json({
      success: true,
      data,
    });
  })
);

// @route   GET /api/admin/analytics/top-customers
// @desc    Get top customers
// @access  Private (Admin)
router.get(
  '/analytics/top-customers',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const customers = await analyticsService.getTopCustomers(undefined, limit);

    res.json({
      success: true,
      data: customers,
    });
  })
);

// @route   GET /api/admin/analytics/low-stock
// @desc    Get low stock products
// @access  Private (Admin)
router.get(
  '/analytics/low-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const threshold = parseInt(req.query.threshold as string) || 10;

    const products = await analyticsService.getLowStockProducts(undefined, threshold);

    res.json({
      success: true,
      data: products,
    });
  })
);

// @route   GET /api/admin/settings
// @desc    Get settings
// @access  Private (Admin)
router.get(
  '/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const settings = await prisma.setting.findMany();

    res.json({
      success: true,
      data: settings,
    });
  })
);

// @route   PUT /api/admin/settings/:key
// @desc    Update setting
// @access  Private (Admin)
router.put(
  '/settings/:key',
  asyncHandler(async (req: Request, res: Response) => {
    const { value } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value },
      create: {
        key: req.params.key,
        value,
      },
    });

    res.json({
      success: true,
      message: 'تم تحديث الإعداد بنجاح',
      data: setting,
    });
  })
);

export default router;
