import { prisma } from '../index';
import { NotFoundError, ValidationError, ConflictError, AuthorizationError } from '../middleware/error.middleware';

export class ReviewService {
  // Get product reviews
  async getProductReviews(productId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    const [reviews, total, ratingStats] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
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
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
    ]);

    // Calculate rating distribution
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const stat = ratingStats.find(s => s.rating === rating);
      return {
        rating,
        count: stat?._count.rating || 0,
        percentage: total > 0 ? Math.round(((stat?._count.rating || 0) / total) * 100) : 0,
      };
    });

    return {
      reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ratingSummary: {
        average: product.rating,
        total,
        distribution,
      },
    };
  }

  // Create review
  async createReview(userId: string, data: {
    productId: string;
    rating: number;
    comment?: string;
  }) {
    const { productId, rating, comment } = data;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new ValidationError('التقييم يجب أن يكون بين 1 و 5');
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('المنتج غير موجود');
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('لقد قمت بتقييم هذا المنتج مسبقاً');
    }

    // Check if user has purchased this product (optional validation)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return review;
  }

  // Update review
  async updateReview(reviewId: string, userId: string, data: {
    rating?: number;
    comment?: string;
  }) {
    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new ValidationError('التقييم يجب أن يكون بين 1 و 5');
    }

    // Get review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('التقييم غير موجود');
    }

    // Check if user owns this review
    if (review.userId !== userId) {
      throw new AuthorizationError('ليس لديك صلاحية لتعديل هذا التقييم');
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(review.productId);

    return updatedReview;
  }

  // Delete review
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('التقييم غير موجود');
    }

    // Check if user owns this review or is admin
    if (!isAdmin && review.userId !== userId) {
      throw new AuthorizationError('ليس لديك صلاحية لحذف هذا التقييم');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product rating
    await this.updateProductRating(review.productId);

    return { message: 'تم حذف التقييم بنجاح' };
  }

  // Get user's reviews
  async getUserReviews(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Check if user can review product
  async canReviewProduct(userId: string, productId: string) {
    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      return {
        canReview: false,
        reason: 'لقد قمت بتقييم هذا المنتج مسبقاً',
      };
    }

    // Check if user has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    if (!hasPurchased) {
      return {
        canReview: false,
        reason: 'يجب شراء المنتج أولاً قبل التقييم',
      };
    }

    return {
      canReview: true,
    };
  }

  // Helper: Update product rating
  private async updateProductRating(productId: string) {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: result._avg.rating || 0,
        reviewCount: result._count.rating || 0,
      },
    });
  }

  // Get pending reviews (products user can review)
  async getPendingReviews(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Get delivered order items that user hasn't reviewed yet
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: 'DELIVERED',
        },
        product: {
          reviews: {
            none: {
              userId,
            },
          },
        },
      },
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
      distinct: ['productId'],
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.orderItem.count({
      where: {
        order: {
          userId,
          status: 'DELIVERED',
        },
        product: {
          reviews: {
            none: {
              userId,
            },
          },
        },
      },
      distinct: ['productId'],
    });

    return {
      products: orderItems.map(item => item.product),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const reviewService = new ReviewService();
