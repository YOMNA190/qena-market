import { Router, Request, Response } from 'express';
import { cartService } from '../services/cart.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate, orderValidations, commonValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.getCart(req.user!.userId);

    res.json({
      success: true,
      data: cart,
    });
  })
);

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post(
  '/items',
  validate(orderValidations.addToCart),
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;

    const cart = await cartService.addToCart(req.user!.userId, productId, quantity);

    res.status(201).json({
      success: true,
      message: 'تم إضافة المنتج إلى السلة',
      data: cart,
    });
  })
);

// @route   PUT /api/cart/items/:id
// @desc    Update cart item quantity
// @access  Private
router.put(
  '/items/:id',
  validate(orderValidations.updateCartItem),
  asyncHandler(async (req: Request, res: Response) => {
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(req.user!.userId, req.params.id, quantity);

    res.json({
      success: true,
      message: 'تم تحديث السلة',
      data: cart,
    });
  })
);

// @route   DELETE /api/cart/items/:id
// @desc    Remove item from cart
// @access  Private
router.delete(
  '/items/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const cart = await cartService.removeFromCart(req.user!.userId, req.params.id);

    res.json({
      success: true,
      message: 'تم إزالة المنتج من السلة',
      data: cart,
    });
  })
);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await cartService.clearCart(req.user!.userId);

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// @route   GET /api/cart/count
// @desc    Get cart item count
// @access  Private
router.get(
  '/count',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await cartService.getCartItemCount(req.user!.userId);

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/cart/sync
// @desc    Sync cart (for logged in users)
// @access  Private
router.post(
  '/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body;

    const cart = await cartService.syncCart(req.user!.userId, items);

    res.json({
      success: true,
      message: 'تم مزامنة السلة',
      data: cart,
    });
  })
);

// @route   GET /api/cart/validate
// @desc    Validate cart before checkout
// @access  Private
router.get(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await cartService.validateCart(req.user!.userId);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
