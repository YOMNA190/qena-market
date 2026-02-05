import { Router, Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { authorizeAdmin, authenticate } from '../middleware/auth.middleware';
import { validate, categoryValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';

    const categories = await categoryService.getCategories({ includeInactive });

    res.json({
      success: true,
      data: categories,
    });
  })
);

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryById(req.params.id);

    res.json({
      success: true,
      data: category,
    });
  })
);

// @route   GET /api/categories/:id/products
// @desc    Get category with products
// @access  Public
router.get(
  '/:id/products',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await categoryService.getCategoryWithProducts(req.params.id, {
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

// Admin routes

// @route   POST /api/categories
// @desc    Create category (admin)
// @access  Private (Admin)
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validate(categoryValidations.createCategory),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إضافة القسم بنجاح',
      data: category,
    });
  })
);

// @route   PUT /api/categories/:id
// @desc    Update category (admin)
// @access  Private (Admin)
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  validate(categoryValidations.updateCategory),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);

    res.json({
      success: true,
      message: 'تم تحديث القسم بنجاح',
      data: category,
    });
  })
);

// @route   DELETE /api/categories/:id
// @desc    Delete category (admin)
// @access  Private (Admin)
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await categoryService.deleteCategory(req.params.id);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   PATCH /api/categories/:id/active
// @desc    Toggle category active status (admin)
// @access  Private (Admin)
router.patch(
  '/:id/active',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.toggleActive(req.params.id);

    res.json({
      success: true,
      message: category.isActive ? 'تم تفعيل القسم' : 'تم إلغاء تفعيل القسم',
      data: category,
    });
  })
);

// @route   POST /api/categories/reorder
// @desc    Reorder categories (admin)
// @access  Private (Admin)
router.post(
  '/reorder',
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { categoryOrders } = req.body;

    await categoryService.reorderCategories(categoryOrders);

    res.json({
      success: true,
      message: 'تم تحديث ترتيب الأقسام',
    });
  })
);

export default router;
