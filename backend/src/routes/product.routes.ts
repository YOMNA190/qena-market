import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service';
import { authorizeAdmin, authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate, productValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get(
  '/',
  validate(productValidations.productFilters),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId as string;
    const shopId = req.query.shopId as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const search = req.query.search as string;
    const isFeatured = req.query.isFeatured === 'true' ? true : undefined;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    const result = await productService.getProducts({
      page,
      limit,
      categoryId,
      shopId,
      minPrice,
      maxPrice,
      search,
      isFeatured,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  })
);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get(
  '/featured',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 12;

    const products = await productService.getFeaturedProducts(limit);

    res.json({
      success: true,
      data: products,
    });
  })
);

// @route   GET /api/products/popular
// @desc    Get popular products
// @access  Public
router.get(
  '/popular',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 12;

    const products = await productService.getPopularProducts(limit);

    res.json({
      success: true,
      data: products,
    });
  })
);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId as string;
    const shopId = req.query.shopId as string;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'نص البحث يجب أن يكون حرفين على الأقل',
      });
    }

    const result = await productService.searchProducts(query, {
      page,
      limit,
      categoryId,
      shopId,
    });

    res.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  })
);

// @route   GET /api/products/category/:categoryId
// @desc    Get products by category
// @access  Public
router.get(
  '/category/:categoryId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await productService.getProductsByCategory(req.params.categoryId, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  })
);

// @route   GET /api/products/shop/:shopId
// @desc    Get products by shop
// @access  Public
router.get(
  '/shop/:shopId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await productService.getProductsByShop(req.params.shopId, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  })
);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProductById(req.params.id);

    res.json({
      success: true,
      data: product,
    });
  })
);

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get(
  '/:id/related',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 8;

    const products = await productService.getRelatedProducts(req.params.id, limit);

    res.json({
      success: true,
      data: products,
    });
  })
);

// Admin routes

// @route   PATCH /api/products/:id/featured
// @desc    Toggle product featured status (admin)
// @access  Private (Admin)
router.patch(
  '/:id/featured',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.toggleFeatured(req.params.id);

    res.json({
      success: true,
      message: product.isFeatured ? 'تم تمييز المنتج' : 'تم إلغاء تمييز المنتج',
      data: product,
    });
  })
);

export default router;
