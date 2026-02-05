import { Router, Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { validate, reviewValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get product reviews
// @access  Public
router.get(
  '/product/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await reviewService.getProductReviews(req.params.productId, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.reviews,
      meta: result.meta,
      ratingSummary: result.ratingSummary,
    });
  })
);

// @route   GET /api/reviews/product/:productId/can-review
// @desc    Check if user can review product
// @access  Private
router.get(
  '/product/:productId/can-review',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.canReviewProduct(
      req.user!.userId,
      req.params.productId
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

// Protected routes
router.use(authenticate);

// @route   GET /api/reviews/my-reviews
// @desc    Get user's reviews
// @access  Private
router.get(
  '/my-reviews',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await reviewService.getUserReviews(req.user!.userId, { page, limit });

    res.json({
      success: true,
      data: result.reviews,
      meta: result.meta,
    });
  })
);

// @route   GET /api/reviews/pending
// @desc    Get pending reviews (products user can review)
// @access  Private
router.get(
  '/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await reviewService.getPendingReviews(req.user!.userId, { page, limit });

    res.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  })
);

// @route   POST /api/reviews
// @desc    Create review
// @access  Private
router.post(
  '/',
  validate(reviewValidations.createReview),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.createReview(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      data: review,
    });
  })
);

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private
router.put(
  '/:id',
  validate(reviewValidations.updateReview),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.updateReview(
      req.params.id,
      req.user!.userId,
      req.body
    );

    res.json({
      success: true,
      message: 'تم تحديث التقييم بنجاح',
      data: review,
    });
  })
);

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === 'ADMIN';
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user!.userId,
      isAdmin
    );

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// Admin routes

// @route   DELETE /api/reviews/admin/:id
// @desc    Delete any review (admin)
// @access  Private (Admin)
router.delete(
  '/admin/:id',
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.deleteReview(req.params.id, '', true);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

export default router;
