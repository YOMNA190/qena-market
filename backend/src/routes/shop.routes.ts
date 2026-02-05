import { Router, Request, Response } from 'express';
import { shopService } from '../services/shop.service';
import { authorizeVendor, authorizeAdmin, authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate, shopValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// @route   GET /api/shops
// @desc    Get all shops
// @access  Public
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId as string;
    const search = req.query.search as string;
    const isFeatured = req.query.isFeatured === 'true';

    const result = await shopService.getShops({
      page,
      limit,
      categoryId,
      search,
      isFeatured,
    });

    res.json({
      success: true,
      data: result.shops,
      meta: result.meta,
    });
  })
);

// @route   GET /api/shops/featured
// @desc    Get featured shops
// @access  Public
router.get(
  '/featured',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;

    const shops = await shopService.getFeaturedShops(limit);

    res.json({
      success: true,
      data: shops,
    });
  })
);

// @route   GET /api/shops/category/:categoryId
// @desc    Get shops by category
// @access  Public
router.get(
  '/category/:categoryId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await shopService.getShopsByCategory(req.params.categoryId, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.shops,
      meta: result.meta,
    });
  })
);

// @route   GET /api/shops/:id
// @desc    Get shop by ID
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.getShopById(req.params.id);

    res.json({
      success: true,
      data: shop,
    });
  })
);

// @route   POST /api/shops
// @desc    Create shop (vendor)
// @access  Private (Vendor)
router.post(
  '/',
  authenticate,
  authorizeVendor,
  validate(shopValidations.createShop),
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود',
      });
    }

    const shop = await shopService.createShop(vendor.id, req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المحل بنجاح وهو قيد المراجعة',
      data: shop,
    });
  })
);

// @route   PUT /api/shops/:id
// @desc    Update shop
// @access  Private (Vendor)
router.put(
  '/:id',
  authenticate,
  authorizeVendor,
  validate(shopValidations.updateShop),
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود',
      });
    }

    const shop = await shopService.updateShop(req.params.id, vendor.id, req.body);

    res.json({
      success: true,
      message: 'تم تحديث المحل بنجاح',
      data: shop,
    });
  })
);

// @route   GET /api/shops/my-shop
// @desc    Get vendor's shop
// @access  Private (Vendor)
router.get(
  '/my-shop',
  authenticate,
  authorizeVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود',
      });
    }

    const shop = await shopService.getShopByVendorId(vendor.id);

    res.json({
      success: true,
      data: shop,
    });
  })
);

// Admin routes

// @route   PATCH /api/shops/:id/status
// @desc    Update shop status (admin)
// @access  Private (Admin)
router.patch(
  '/:id/status',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    const shop = await shopService.updateShopStatus(req.params.id, status);

    res.json({
      success: true,
      message: 'تم تحديث حالة المحل بنجاح',
      data: shop,
    });
  })
);

// @route   PATCH /api/shops/:id/featured
// @desc    Toggle shop featured status (admin)
// @access  Private (Admin)
router.patch(
  '/:id/featured',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const shop = await shopService.toggleFeatured(req.params.id);

    res.json({
      success: true,
      message: shop.isFeatured ? 'تم تمييز المحل' : 'تم إلغاء تمييز المحل',
      data: shop,
    });
  })
);

// @route   DELETE /api/shops/:id
// @desc    Delete shop (admin)
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await shopService.deleteShop(req.params.id);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

export default router;
