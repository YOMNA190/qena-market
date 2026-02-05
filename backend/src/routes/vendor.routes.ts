import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authorizeVendor, authorizeAdmin, authenticate } from '../middleware/auth.middleware';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware';
import { analyticsService } from '../services/analytics.service';
import { orderService } from '../services/order.service';
import { productService } from '../services/product.service';
import { offerService } from '../services/offer.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/vendors/dashboard
// @desc    Get vendor dashboard stats
// @access  Private (Vendor)
router.get(
  '/dashboard',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    // Get vendor's shop
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const stats = await analyticsService.getVendorDashboardStats(vendor.id, shopId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// @route   GET /api/vendors/orders
// @desc    Get vendor orders
// @access  Private (Vendor)
router.get(
  '/orders',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await orderService.getShopOrders(shopId, { page, limit, status });

    res.json({
      success: true,
      data: result.orders,
      meta: result.meta,
    });
  })
);

// @route   GET /api/vendors/orders/:id
// @desc    Get vendor order by ID
// @access  Private (Vendor)
router.get(
  '/orders/:id',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const order = await orderService.getOrderById(req.params.id, undefined, shopId);

    res.json({
      success: true,
      data: order,
    });
  })
);

// @route   PATCH /api/vendors/orders/:id/status
// @desc    Update order status
// @access  Private (Vendor)
router.patch(
  '/orders/:id/status',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      undefined,
      shopId
    );

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      data: order,
    });
  })
);

// @route   GET /api/vendors/products
// @desc    Get vendor products
// @access  Private (Vendor)
router.get(
  '/products',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await productService.getProductsByShop(shopId, {
      page,
      limit,
      isActive: undefined, // Get all products
    });

    res.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  })
);

// @route   POST /api/vendors/products
// @desc    Create product
// @access  Private (Vendor)
router.post(
  '/products',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const product = await productService.createProduct(shopId, req.body);

    res.status(201).json({
      success: true,
      message: 'تم إضافة المنتج بنجاح',
      data: product,
    });
  })
);

// @route   GET /api/vendors/products/:id
// @desc    Get vendor product by ID
// @access  Private (Vendor)
router.get(
  '/products/:id',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProductById(req.params.id);

    // Verify product belongs to vendor's shop
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || !vendor.shops.some(shop => shop.id === product.shopId)) {
      throw new NotFoundError('المنتج غير موجود');
    }

    res.json({
      success: true,
      data: product,
    });
  })
);

// @route   PUT /api/vendors/products/:id
// @desc    Update product
// @access  Private (Vendor)
router.put(
  '/products/:id',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const product = await productService.updateProduct(req.params.id, shopId, req.body);

    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح',
      data: product,
    });
  })
);

// @route   DELETE /api/vendors/products/:id
// @desc    Delete product
// @access  Private (Vendor)
router.delete(
  '/products/:id',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const result = await productService.deleteProduct(req.params.id, shopId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   GET /api/vendors/offers
// @desc    Get vendor offers
// @access  Private (Vendor)
router.get(
  '/offers',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const includeInactive = req.query.includeInactive === 'true';

    const result = await offerService.getShopOffers(shopId, {
      page,
      limit,
      includeInactive,
    });

    res.json({
      success: true,
      data: result.offers,
      meta: result.meta,
    });
  })
);

// @route   POST /api/vendors/offers
// @desc    Create offer
// @access  Private (Vendor)
router.post(
  '/offers',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const offer = await offerService.createOffer(shopId, req.body);

    res.status(201).json({
      success: true,
      message: 'تم إضافة العرض بنجاح',
      data: offer,
    });
  })
);

// @route   PUT /api/vendors/offers/:id
// @desc    Update offer
// @access  Private (Vendor)
router.put(
  '/offers/:id',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const offer = await offerService.updateOffer(req.params.id, shopId, req.body);

    res.json({
      success: true,
      message: 'تم تحديث العرض بنجاح',
      data: offer,
    });
  })
);

// @route   DELETE /api/vendors/offers/:id
// @desc    Delete offer
// @access  Private (Vendor)
router.delete(
  '/offers/:id',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const result = await offerService.deleteOffer(req.params.id, shopId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   GET /api/vendors/analytics/sales
// @desc    Get sales chart data
// @access  Private (Vendor)
router.get(
  '/analytics/sales',
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
      include: { shops: true },
    });

    if (!vendor || vendor.shops.length === 0) {
      throw new NotFoundError('لم يتم العثور على محل');
    }

    const shopId = vendor.shops[0].id;
    const days = parseInt(req.query.days as string) || 30;

    const data = await analyticsService.getSalesChartData(shopId, days);

    res.json({
      success: true,
      data,
    });
  })
);

// Admin routes for vendor management

// @route   GET /api/vendors
// @desc    Get all vendors (admin)
// @access  Private (Admin)
router.get(
  '/',
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              status: true,
            },
          },
          shops: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              shops: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where }),
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

// @route   PATCH /api/vendors/:id/status
// @desc    Update vendor status (admin)
// @access  Private (Admin)
router.patch(
  '/:id/status',
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({
      success: true,
      message: 'تم تحديث حالة البائع بنجاح',
      data: vendor,
    });
  })
);

export default router;
