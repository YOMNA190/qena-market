import { prisma } from '../index';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/error.middleware';

export class ProductService {
  // Get all products with filters
  async getProducts(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    isFeatured?: boolean;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      shopId,
      minPrice,
      maxPrice,
      search,
      isFeatured,
      isActive = true,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (shopId) {
      where.shopId = shopId;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get products with count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          category: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              logo: true,
              status: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(product => ({
        ...product,
        reviewCount: product._count.reviews,
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

  // Get product by ID
  async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            whatsapp: true,
            address: true,
            status: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    // Increment view count
    await prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...product,
      reviewCount: product._count.reviews,
      _count: undefined,
    };
  }

  // Create product (vendor only)
  async createProduct(shopId: string, data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    salePrice?: number;
    stock: number;
    unit?: string;
    images?: string[];
  }) {
    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('القسم غير موجود');
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        shopId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        stock: data.stock,
        unit: data.unit || 'piece',
        isActive: true,
      },
    });

    // Add images if provided
    if (data.images && data.images.length > 0) {
      await prisma.productImage.createMany({
        data: data.images.map((url, index) => ({
          productId: product.id,
          imageUrl: url,
          sortOrder: index,
        })),
      });
    }

    // Return product with images
    return this.getProductById(product.id);
  }

  // Update product
  async updateProduct(productId: string, shopId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    salePrice?: number;
    stock?: number;
    unit?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    images?: string[];
  }) {
    // Check if product exists and belongs to shop
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        shopId,
      },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        stock: data.stock,
        unit: data.unit,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
    });

    // Update images if provided
    if (data.images) {
      // Delete existing images
      await prisma.productImage.deleteMany({
        where: { productId },
      });

      // Add new images
      if (data.images.length > 0) {
        await prisma.productImage.createMany({
          data: data.images.map((url, index) => ({
            productId,
            imageUrl: url,
            sortOrder: index,
          })),
        });
      }
    }

    return this.getProductById(productId);
  }

  // Delete product
  async deleteProduct(productId: string, shopId: string) {
    // Check if product exists and belongs to shop
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        shopId,
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    if (product._count.orderItems > 0) {
      // Soft delete - just deactivate
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
      return { message: 'تم إلغاء تفعيل المنتج' };
    }

    // Hard delete
    await prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'تم حذف المنتج بنجاح' };
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 12) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        shop: {
          status: 'ACTIVE',
        },
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return products.map(product => ({
      ...product,
      reviewCount: product._count.reviews,
      _count: undefined,
    }));
  }

  // Get products by shop
  async getProductsByShop(shopId: string, options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}) {
    const { page = 1, limit = 20, isActive } = options;

    return this.getProducts({
      page,
      limit,
      shopId,
      isActive,
    });
  }

  // Get products by category
  async getProductsByCategory(categoryId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;

    return this.getProducts({
      page,
      limit,
      categoryId,
    });
  }

  // Search products
  async searchProducts(query: string, options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    shopId?: string;
  } = {}) {
    const { page = 1, limit = 20, categoryId, shopId } = options;

    return this.getProducts({
      page,
      limit,
      search: query,
      categoryId,
      shopId,
    });
  }

  // Update product stock
  async updateStock(productId: string, shopId: string, quantity: number) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        shopId,
      },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    const newStock = Math.max(0, product.stock + quantity);

    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    return { message: 'تم تحديث المخزون', stock: newStock };
  }

  // Get related products
  async getRelatedProducts(productId: string, limit: number = 8) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        categoryId: true,
        shopId: true,
      },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          { shopId: product.shopId },
        ],
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
      orderBy: { rating: 'desc' },
      take: limit,
    });

    return relatedProducts;
  }

  // Get popular products
  async getPopularProducts(limit: number = 12) {
    const products = await prisma.product.findMany({
      where: {
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
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    });

    return products.map(product => ({
      ...product,
      reviewCount: product._count.reviews,
      _count: undefined,
    }));
  }

  // Toggle product featured status (admin only)
  async toggleFeatured(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isFeatured: !product.isFeatured },
    });

    return updatedProduct;
  }
}

export const productService = new ProductService();
