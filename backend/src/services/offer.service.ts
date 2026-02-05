import { prisma } from '../index';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/error.middleware';

export class OfferService {
  // Get all active offers
  async getActiveOffers(options: {
    page?: number;
    limit?: number;
    shopId?: string;
  } = {}) {
    const { page = 1, limit = 20, shopId } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    if (shopId) {
      where.shopId = shopId;
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              logo: true,
              category: {
                select: {
                  id: true,
                  nameAr: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    return {
      offers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop offers (vendor)
  async getShopOffers(shopId: string, options: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}) {
    const { page = 1, limit = 20, includeInactive = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    return {
      offers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get offer by ID
  async getOfferById(offerId: string) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            whatsapp: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundError('العرض غير موجود');
    }

    return offer;
  }

  // Create offer (vendor)
  async createOffer(shopId: string, data: {
    title: string;
    description?: string;
    discountPercent: number;
    startDate: Date;
    endDate: Date;
  }) {
    // Validate dates
    if (data.startDate >= data.endDate) {
      throw new ValidationError('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء');
    }

    if (data.endDate < new Date()) {
      throw new ValidationError('تاريخ الانتهاء يجب أن يكون في المستقبل');
    }

    // Validate discount
    if (data.discountPercent < 1 || data.discountPercent > 99) {
      throw new ValidationError('نسبة الخصم يجب أن تكون بين 1 و 99');
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError('المحل غير موجود');
    }

    const offer = await prisma.offer.create({
      data: {
        shopId,
        title: data.title,
        description: data.description,
        discountPercent: data.discountPercent,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return offer;
  }

  // Update offer (vendor)
  async updateOffer(offerId: string, shopId: string, data: {
    title?: string;
    description?: string;
    discountPercent?: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }) {
    // Get offer
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        shopId,
      },
    });

    if (!offer) {
      throw new NotFoundError('العرض غير موجود');
    }

    // Validate discount if provided
    if (data.discountPercent !== undefined && (data.discountPercent < 1 || data.discountPercent > 99)) {
      throw new ValidationError('نسبة الخصم يجب أن تكون بين 1 و 99');
    }

    // Validate dates if provided
    if (data.startDate && data.endDate) {
      if (data.startDate >= data.endDate) {
        throw new ValidationError('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء');
      }
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        title: data.title,
        description: data.description,
        discountPercent: data.discountPercent,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
      },
    });

    return updatedOffer;
  }

  // Delete offer (vendor)
  async deleteOffer(offerId: string, shopId: string) {
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        shopId,
      },
    });

    if (!offer) {
      throw new NotFoundError('العرض غير موجود');
    }

    await prisma.offer.delete({
      where: { id: offerId },
    });

    return { message: 'تم حذف العرض بنجاح' };
  }

  // Toggle offer active status
  async toggleActive(offerId: string, shopId: string) {
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        shopId,
      },
    });

    if (!offer) {
      throw new NotFoundError('العرض غير موجود');
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { isActive: !offer.isActive },
    });

    return updatedOffer;
  }

  // Get featured offers
  async getFeaturedOffers(limit: number = 6) {
    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: {
              select: {
                id: true,
                nameAr: true,
              },
            },
          },
        },
      },
      orderBy: { discountPercent: 'desc' },
      take: limit,
    });

    return offers;
  }

  // Get expiring soon offers
  async getExpiringSoonOffers(days: number = 3, limit: number = 10) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        endDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
      take: limit,
    });

    return offers;
  }

  // Validate offer is active
  async validateOffer(offerId: string): Promise<boolean> {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return false;
    }

    return (
      offer.isActive &&
      offer.startDate <= new Date() &&
      offer.endDate >= new Date()
    );
  }
}

export const offerService = new OfferService();
