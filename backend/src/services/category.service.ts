import { prisma } from '../index';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error.middleware';

export class CategoryService {
  // Get all categories
  async getCategories(options: {
    isActive?: boolean;
    includeInactive?: boolean;
  } = {}) {
    const { isActive = true, includeInactive = false } = options;

    const where: any = {};
    if (!includeInactive) {
      where.isActive = isActive;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            shops: {
              where: { status: 'ACTIVE' },
            },
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return categories.map(category => ({
      ...category,
      shopCount: category._count.shops,
      productCount: category._count.products,
      _count: undefined,
    }));
  }

  // Get category by ID
  async getCategoryById(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        shops: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            logo: true,
            rating: true,
          },
          take: 6,
        },
        _count: {
          select: {
            shops: {
              where: { status: 'ACTIVE' },
            },
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    return {
      ...category,
      shopCount: category._count.shops,
      productCount: category._count.products,
      _count: undefined,
    };
  }

  // Create category (admin only)
  async createCategory(data: {
    nameAr: string;
    nameEn: string;
    description?: string;
    icon?: string;
    image?: string;
    sortOrder?: number;
  }) {
    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { nameAr: data.nameAr },
          { nameEn: data.nameEn },
        ],
      },
    });

    if (existingCategory) {
      throw new ConflictError('القسم موجود مسبقاً');
    }

    const category = await prisma.category.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        icon: data.icon,
        image: data.image,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      },
    });

    return category;
  }

  // Update category (admin only)
  async updateCategory(categoryId: string, data: {
    nameAr?: string;
    nameEn?: string;
    description?: string;
    icon?: string;
    image?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    // Check if new name already exists
    if (data.nameAr || data.nameEn) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [
            data.nameAr ? { nameAr: data.nameAr } : undefined,
            data.nameEn ? { nameEn: data.nameEn } : undefined,
          ].filter(Boolean) as any,
          NOT: { id: categoryId },
        },
      });

      if (existingCategory) {
        throw new ConflictError('اسم القسم موجود مسبقاً');
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        icon: data.icon,
        image: data.image,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    return updatedCategory;
  }

  // Delete category (admin only)
  async deleteCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            shops: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    if (category._count.shops > 0 || category._count.products > 0) {
      throw new ValidationError('لا يمكن حذف القسم لأنه يحتوي على محلات أو منتجات');
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'تم حذف القسم بنجاح' };
  }

  // Reorder categories (admin only)
  async reorderCategories(categoryOrders: { id: string; sortOrder: number }[]) {
    const updates = categoryOrders.map(({ id, sortOrder }) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder },
      })
    );

    await prisma.$transaction(updates);

    return { message: 'تم تحديث ترتيب الأقسام' };
  }

  // Toggle category active status (admin only)
  async toggleActive(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: !category.isActive },
    });

    return updatedCategory;
  }

  // Get category with products
  async getCategoryWithProducts(categoryId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId,
          isActive: true,
          shop: {
            status: 'ACTIVE',
          },
        },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: {
          categoryId,
          isActive: true,
          shop: {
            status: 'ACTIVE',
          },
        },
      }),
    ]);

    return {
      category,
      products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const categoryService = new CategoryService();
