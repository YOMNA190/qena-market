import { Router, Request, Response } from 'express';
import { offerService } from '../services/offer.service';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// @route   GET /api/offers
// @desc    Get active offers
// @access  Public
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const shopId = req.query.shopId as string;

    const result = await offerService.getActiveOffers({ page, limit, shopId });

    res.json({
      success: true,
      data: result.offers,
      meta: result.meta,
    });
  })
);

// @route   GET /api/offers/featured
// @desc    Get featured offers
// @access  Public
router.get(
  '/featured',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;

    const offers = await offerService.getFeaturedOffers(limit);

    res.json({
      success: true,
      data: offers,
    });
  })
);

// @route   GET /api/offers/expiring-soon
// @desc    Get expiring soon offers
// @access  Public
router.get(
  '/expiring-soon',
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 3;
    const limit = parseInt(req.query.limit as string) || 10;

    const offers = await offerService.getExpiringSoonOffers(days, limit);

    res.json({
      success: true,
      data: offers,
    });
  })
);

// @route   GET /api/offers/:id
// @desc    Get offer by ID
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const offer = await offerService.getOfferById(req.params.id);

    res.json({
      success: true,
      data: offer,
    });
  })
);

export default router;
