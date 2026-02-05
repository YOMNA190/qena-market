import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/helpers';
import { AuthenticationError, AuthorizationError } from './error.middleware';
import { UserRole } from '../types';
import { prisma } from '../index';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & {
        id: string;
        fullName: string;
      };
    }
  }
}

// Authenticate user middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('لم يتم توفير رمز المصادقة');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AuthenticationError('رمز المصادقة غير موجود');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('المستخدم غير موجود');
    }

    if (user.status === 'INACTIVE') {
      throw new AuthenticationError('الحساب غير نشط');
    }

    if (user.status === 'SUSPENDED') {
      throw new AuthenticationError('الحساب موقوف');
    }

    // Attach user to request
    req.user = {
      ...decoded,
      id: user.id,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = {
        ...decoded,
        id: user.id,
        fullName: user.fullName,
      };
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// Authorize roles middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('يجب تسجيل الدخول أولاً'));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AuthorizationError('ليس لديك صلاحية للوصول إلى هذا المورد'));
    }

    next();
  };
};

// Authorize admin only
export const authorizeAdmin = authorize(UserRole.ADMIN);

// Authorize vendor only
export const authorizeVendor = authorize(UserRole.VENDOR);

// Authorize customer only
export const authorizeCustomer = authorize(UserRole.CUSTOMER);

// Authorize admin or vendor
export const authorizeAdminOrVendor = authorize(UserRole.ADMIN, UserRole.VENDOR);

// Check if user owns the resource or is admin
export const authorizeOwnerOrAdmin = (
  getOwnerId: (req: Request) => Promise<string | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('يجب تسجيل الدخول أولاً'));
    }

    // Admin can access everything
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    try {
      const ownerId = await getOwnerId(req);

      if (ownerId !== req.user.userId) {
        return next(new AuthorizationError('ليس لديك صلاحية للوصول إلى هذا المورد'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if vendor owns the shop
export const authorizeShopOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AuthenticationError('يجب تسجيل الدخول أولاً'));
  }

  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  if (req.user.role !== UserRole.VENDOR) {
    return next(new AuthorizationError('ليس لديك صلاحية للوصول إلى هذا المورد'));
  }

  try {
    const shopId = req.params.shopId || req.body.shopId;

    if (!shopId) {
      return next(new AuthorizationError('معرف المحل مطلوب'));
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.userId },
      include: {
        shops: {
          where: { id: shopId },
          select: { id: true },
        },
      },
    });

    if (!vendor || vendor.shops.length === 0) {
      return next(new AuthorizationError('ليس لديك صلاحية للوصول إلى هذا المحل'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Refresh token middleware
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError('رمز التحديث غير موجود');
    }

    // Verify refresh token
    const decoded = verifyAccessToken(refreshToken);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AuthenticationError('المستخدم غير موجود أو غير نشط');
    }

    req.user = {
      ...decoded,
      id: user.id,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    next(error);
  }
};
