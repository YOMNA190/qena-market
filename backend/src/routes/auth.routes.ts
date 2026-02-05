import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate, authValidations } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  validate(authValidations.register),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName, phone, role } = req.body;

    const result = await authService.register({
      email,
      password,
      fullName,
      phone,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: result,
    });
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  validate(authValidations.login),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: result,
    });
  })
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side only, but we can invalidate tokens here if using Redis)
// @access  Private
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // In a more advanced implementation, you might want to blacklist the token in Redis
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  })
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  })
);

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post(
  '/change-password',
  authenticate,
  validate(authValidations.changePassword),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  })
);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post(
  '/forgot-password',
  validate(authValidations.forgotPassword),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور',
    });
  })
);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post(
  '/reset-password',
  validate(authValidations.resetPassword),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
    });
  })
);

export default router;
