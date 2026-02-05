import { prisma } from '../index';
import { NotFoundError, ValidationError, AuthorizationError } from '../middleware/error.middleware';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../types';
import { generateOrderNumber } from '../utils/helpers';

export class OrderService {
  // Create order from cart
  async createOrder(userId: string, data: {
    addressId: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) {
    const { addressId, paymentMethod, notes } = data;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ValidationError('السلة فارغة');
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundError('العنوان غير موجود');
    }

    // Group items by shop
    const itemsByShop = cart.items.reduce((acc, item) => {
      const shopId = item.product.shopId;
      if (!acc[shopId]) {
        acc[shopId] = [];
      }
      acc[shopId].push(item);
      return acc;
    }, {} as Record<string, typeof cart.items>);

    // Create orders for each shop
    const orders = [];
    const deliveryFee = 25; // Default delivery fee

    for (const [shopId, items] of Object.entries(itemsByShop)) {
      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        const price = item.product.salePrice || item.product.price;
        subtotal += Number(price) * item.quantity;
      }

      const total = subtotal + deliveryFee;

      // Check stock availability
      for (const item of items) {
        if (item.product.stock < item.quantity) {
          throw new ValidationError(`الكمية المطلوبة من ${item.product.name} غير متوفرة`);
        }
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          shopId,
          addressId,
          status: OrderStatus.PENDING,
          paymentStatus: paymentMethod === PaymentMethod.CASH_ON_DELIVERY 
            ? PaymentStatus.PENDING 
            : PaymentStatus.PENDING,
          paymentMethod,
          subtotal,
          deliveryFee,
          total,
          notes,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.salePrice || item.product.price,
              quantity: item.quantity,
              total: Number(item.product.salePrice || item.product.price) * item.quantity,
            })),
          },
        },
        include: {
          items: {
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
          },
          shop: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          address: true,
        },
      });

      // Update product stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      orders.push(order);

      // Create notification for vendor
      await prisma.notification.create({
        data: {
          userId: order.shop.vendorId,
          type: 'ORDER',
          title: 'طلب جديد',
          message: `لديك طلب جديد برقم ${order.orderNumber}`,
          data: { orderId: order.id },
        },
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return orders;
  }

  // Get user orders
  async getUserOrders(userId: string, options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  } = {}) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
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
          },
          shop: {
            select: {
              id: true,
              name: true,
              logo: true,
              phone: true,
            },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get shop orders (vendor)
  async getShopOrders(shopId: string, options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  } = {}) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order by ID
  async getOrderById(orderId: string, userId?: string, shopId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
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
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            whatsapp: true,
          },
        },
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب غير موجود');
    }

    // Check authorization
    if (userId && order.userId !== userId && order.shop.vendorId !== userId) {
      throw new AuthorizationError('ليس لديك صلاحية لعرض هذا الطلب');
    }

    if (shopId && order.shopId !== shopId) {
      throw new AuthorizationError('ليس لديك صلاحية لعرض هذا الطلب');
    }

    return order;
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    userId?: string,
    shopId?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: true,
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب غير موجود');
    }

    // Check authorization
    if (userId && order.userId !== userId && order.shop.vendorId !== userId) {
      throw new AuthorizationError('ليس لديك صلاحية لتحديث هذا الطلب');
    }

    if (shopId && order.shopId !== shopId) {
      throw new AuthorizationError('ليس لديك صلاحية لتحديث هذا الطلب');
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(order.status);
    if (!validTransitions.includes(status)) {
      throw new ValidationError(`لا يمكن تغيير حالة الطلب من ${order.status} إلى ${status}`);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER',
        title: 'تحديث حالة الطلب',
        message: `تم تحديث حالة طلبك رقم ${order.orderNumber} إلى ${this.getStatusLabel(status)}`,
        data: { orderId: order.id },
      },
    });

    return updatedOrder;
  }

  // Cancel order
  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError('الطلب غير موجود');
    }

    // Only order owner can cancel
    if (order.userId !== userId) {
      throw new AuthorizationError('ليس لديك صلاحية لإلغاء هذا الطلب');
    }

    // Can only cancel pending or confirmed orders
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new ValidationError('لا يمكن إلغاء الطلب في هذه الحالة');
    }

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER',
        title: 'تم إلغاء الطلب',
        message: `تم إلغاء الطلب رقم ${order.orderNumber}`,
        data: { orderId: order.id },
      },
    });

    return updatedOrder;
  }

  // Get all orders (admin)
  async getAllOrders(options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    shopId?: string;
    userId?: string;
  } = {}) {
    const { page = 1, limit = 20, status, shopId, userId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (shopId) where.shopId = shopId;
    if (userId) where.userId = userId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
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
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order statistics
  async getOrderStatistics(shopId?: string) {
    const where: any = {};
    if (shopId) where.shopId = shopId;

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.PREPARING } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.READY } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.OUT_FOR_DELIVERY } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      prisma.order.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...where,
          paymentStatus: PaymentStatus.PAID,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
    };
  }

  // Helper: Get valid status transitions
  private getValidStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return transitions[currentStatus] || [];
  }

  // Helper: Get status label in Arabic
  private getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'قيد الانتظار',
      [OrderStatus.CONFIRMED]: 'تم التأكيد',
      [OrderStatus.PREPARING]: 'جاري التحضير',
      [OrderStatus.READY]: 'جاهز للاستلام',
      [OrderStatus.OUT_FOR_DELIVERY]: 'في الطريق',
      [OrderStatus.DELIVERED]: 'تم التوصيل',
      [OrderStatus.CANCELLED]: 'ملغي',
      [OrderStatus.REFUNDED]: 'تم الاسترجاع',
    };

    return labels[status] || status;
  }
}

export const orderService = new OrderService();
