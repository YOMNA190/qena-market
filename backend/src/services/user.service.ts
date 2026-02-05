import { prisma } from '../index';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error.middleware';
import { isValidEgyptianPhone } from '../utils/helpers';

export class UserService {
  // Get user by ID
  async getUserById(userId: string) {
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
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundError('المستخدم غير موجود');
    }

    return user;
  }

  // Update user profile
  async updateProfile(userId: string, data: {
    fullName?: string;
    phone?: string;
    avatar?: string;
  }) {
    // Check if phone is already used by another user
    if (data.phone) {
      if (!isValidEgyptianPhone(data.phone)) {
        throw new ValidationError('رقم الهاتف غير صالح');
      }

      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: userId },
        },
      });

      if (existingPhone) {
        throw new ConflictError('رقم الهاتف مستخدم مسبقاً');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        avatar: data.avatar,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Get user addresses
  async getAddresses(userId: string) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return addresses;
  }

  // Get address by ID
  async getAddressById(addressId: string, userId: string) {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundError('العنوان غير موجود');
    }

    return address;
  }

  // Create address
  async createAddress(userId: string, data: {
    city: string;
    district: string;
    street: string;
    building: string;
    floor?: string;
    apartment?: string;
    phone: string;
    notes?: string;
    isDefault?: boolean;
  }) {
    // Validate phone
    if (!isValidEgyptianPhone(data.phone)) {
      throw new ValidationError('رقم الهاتف غير صالح');
    }

    // If this is the first address, make it default
    const addressCount = await prisma.address.count({
      where: { userId },
    });

    const isDefault = addressCount === 0 ? true : (data.isDefault || false);

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        city: data.city,
        district: data.district,
        street: data.street,
        building: data.building,
        floor: data.floor,
        apartment: data.apartment,
        phone: data.phone,
        notes: data.notes,
        isDefault,
      },
    });

    return address;
  }

  // Update address
  async updateAddress(addressId: string, userId: string, data: {
    city?: string;
    district?: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    phone?: string;
    notes?: string;
    isDefault?: boolean;
  }) {
    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError('العنوان غير موجود');
    }

    // Validate phone if provided
    if (data.phone && !isValidEgyptianPhone(data.phone)) {
      throw new ValidationError('رقم الهاتف غير صالح');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        city: data.city,
        district: data.district,
        street: data.street,
        building: data.building,
        floor: data.floor,
        apartment: data.apartment,
        phone: data.phone,
        notes: data.notes,
        isDefault: data.isDefault,
      },
    });

    return address;
  }

  // Delete address
  async deleteAddress(addressId: string, userId: string) {
    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError('العنوان غير موجود');
    }

    // Check if address is used in any order
    const ordersWithAddress = await prisma.order.count({
      where: { addressId },
    });

    if (ordersWithAddress > 0) {
      throw new ValidationError('لا يمكن حذف العنوان لأنه مستخدم في طلبات سابقة');
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    // If deleted address was default, set another as default
    if (existingAddress.isDefault) {
      const anotherAddress = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (anotherAddress) {
        await prisma.address.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'تم حذف العنوان بنجاح' };
  }

  // Get user notifications
  async getNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('الإشعار غير موجود');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { message: 'تم تحديث الإشعار' };
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'تم تحديث جميع الإشعارات' };
  }

  // Get unread notifications count
  async getUnreadNotificationsCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  // Get user favorites
  async getFavorites(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
              shop: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Add to favorites
  async addToFavorites(userId: string, productId: string) {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictError('المنتج موجود في المفضلة مسبقاً');
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    return favorite;
  }

  // Remove from favorites
  async removeFromFavorites(userId: string, productId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundError('المنتج غير موجود في المفضلة');
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { message: 'تم إزالة المنتج من المفضلة' };
  }

  // Check if product is in favorites
  async isInFavorites(userId: string, productId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }
}

export const userService = new UserService();
