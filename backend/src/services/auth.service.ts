import { prisma } from '../index';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from '../utils/helpers';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../middleware/error.middleware';
import { IAuthTokens, ILoginCredentials, IRegisterData, UserRole } from '../types';

export class AuthService {
  // Register new user
  async register(data: IRegisterData): Promise<{ user: any; tokens: IAuthTokens }> {
    const { email, password, fullName, phone, role = UserRole.CUSTOMER } = data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictError('البريد الإلكتروني مستخدم مسبقاً');
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        throw new ConflictError('رقم الهاتف مستخدم مسبقاً');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        role,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
      },
    });

    // If user is vendor, create vendor record
    if (role === UserRole.VENDOR) {
      await prisma.vendor.create({
        data: {
          userId: user.id,
          shopName: fullName,
          status: 'PENDING',
        },
      });
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  // Login user
  async login(credentials: ILoginCredentials): Promise<{ user: any; tokens: IAuthTokens }> {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // Check if user is active
    if (user.status === 'INACTIVE') {
      throw new AuthenticationError('الحساب غير نشط');
    }

    if (user.status === 'SUSPENDED') {
      throw new AuthenticationError('الحساب موقوف');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<IAuthTokens> {
    try {
      const { verifyRefreshToken } = await import('../utils/helpers');
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AuthenticationError('المستخدم غير موجود أو غير نشط');
      }

      // Generate new tokens
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      throw new AuthenticationError('رمز التحديث غير صالح');
    }
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('المستخدم غير موجود');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new ValidationError('كلمة المرور الحالية غير صحيحة');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Forgot password (send reset email)
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token (in production, send email)
    const resetToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // TODO: Send email with reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const { verifyAccessToken } = await import('../utils/helpers');
      const decoded = verifyAccessToken(token);

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });
    } catch (error) {
      throw new ValidationError('رمز إعادة تعيين كلمة المرور غير صالح');
    }
  }

  // Get current user
  async getCurrentUser(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        vendor: {
          select: {
            id: true,
            shopName: true,
            status: true,
          },
        },
        admin: {
          select: {
            id: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('المستخدم غير موجود');
    }

    return user;
  }

  // Generate tokens helper
  private generateTokens(payload: TokenPayload): IAuthTokens {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Decode access token to get expiration
    const decoded = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());

    return {
      accessToken,
      refreshToken,
      expiresIn: decoded.exp - Math.floor(Date.now() / 1000),
    };
  }
}

export const authService = new AuthService();
