import { prisma } from '../index';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/error.middleware';
import { ShopStatus } from '../types';

export class ShopService {
  // Get all shops with filters
  async getShops(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    status?: ShopStatus;
    isFeatured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      status = ShopStatus.ACTIVE,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get shops with count
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          vendor: {
            select: {
              id: true,
              shopName: true,
              phone: true,
              whatsapp: true,
            },
          },
          _count: {
            select: {
              products: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    return {
      shops: shops.map(shop => ({
        ...shop,
        productCount: shop._count.products,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop by ID
  async getShopById(shopId: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        vendor: {
          select: {
            id: true,
            shopName: true,
            phone: true,
            whatsapp: true,
          },
        },
        products: {
          where: { isActive: true },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        offers: {
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    // Increment view count
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        // viewCount: { increment: 1 },
      },
    });

    return {
      ...shop,
      productCount: shop._count.products,
      _count: undefined,
    };
  }

  // Get shop by vendor ID
  async getShopByVendorId(vendorId: string) {
    const shop = await prisma.shop.findFirst({
      where: { vendorId },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        products: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        offers: {
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    return {
      ...shop,
      productCount: shop._count.products,
      orderCount: shop._count.orders,
      _count: undefined,
    };
  }

  // Create shop (vendor only)
  async createShop(vendorId: string, data: {
    categoryId: string;
    name: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    location?: string;
    openingTime?: string;
    closingTime?: string;
    logo?: string;
    cover?: string;
  }) {
    // Check if vendor already has a shop
    const existingShop = await prisma.shop.findFirst({
      where: { vendorId },
    });

    if (existingShop) {
      throw new ValidationError('لديك محل مسجل مسبقاً');
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    const shop = await prisma.shop.create({
      data: {
        vendorId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        location: data.location,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        logo: data.logo,
        cover: data.cover,
        status: ShopStatus.PENDING,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return shop;
  }

  // Update shop
  async updateShop(shopId: string, vendorId: string, data: {
    name?: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    location?: string;
    openingTime?: string;
    closingTime?: string;
    logo?: string;
    cover?: string;
    isActive?: boolean;
  }) {
    // Check if shop exists and belongs to vendor
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        vendorId,
      },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: data.name,
        description: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        location: data.location,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        logo: data.logo,
        cover: data.cover,
        isActive: data.isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return updatedShop;
  }

  // Update shop status (admin only)
  async updateShopStatus(shopId: string, status: ShopStatus) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { status },
    });

    return updatedShop;
  }

  // Delete shop (admin only)
  async deleteShop(shopId: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    if (shop._count.orders > 0) {
      throw new ValidationError('لا يمكن حذف المحل لأنه لديه طلبات مرتبطة');
    }

    await prisma.shop.delete({
      where: { id: shopId },
    });

    return { message: 'تم حذف المحل بنجاح' };
  }

  // Get featured shops
  async getFeaturedShops(limit: number = 6) {
    const shops = await prisma.shop.findMany({
      where: {
        status: ShopStatus.ACTIVE,
        isFeatured: true,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      take: limit,
    });

    return shops.map(shop => ({
      ...shop,
      productCount: shop._count.products,
      _count: undefined,
    }));
  }

  // Get shops by category
  async getShopsByCategory(categoryId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where: {
          categoryId,
          status: ShopStatus.ACTIVE,
        },
        include: {
          category: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              products: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { rating: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shop.count({
        where: {
          categoryId,
          status: ShopStatus.ACTIVE,
        },
      }),
    ]);

    return {
      shops: shops.map(shop => ({
        ...shop,
        productCount: shop._count.products,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop statistics (for vendor dashboard)
  async getShopStatistics(shopId: string, vendorId: string) {
    // Verify shop belongs to vendor
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        vendorId,
      },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { shopId } }),
      prisma.product.count({ where: { shopId, isActive: true } }),
      prisma.order.count({ where: { shopId } }),
      prisma.order.count({ where: { shopId, status: 'PENDING' } }),
      prisma.order.aggregate({
        where: { shopId, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              fullName: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      recentOrders,
    };
  }

  // Toggle shop featured status (admin only)
  async toggleFeatured(shopId: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { isFeatured: !shop.isFeatured },
    });

    return updatedShop;
  }
}

export const shopService = new ShopService();
