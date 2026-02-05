import { prisma } from '../index';
import { OrderStatus, PaymentStatus } from '../types';

export class AnalyticsService {
  // Get admin dashboard statistics
  async getAdminDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      totalVendors,
      pendingVendors,
      totalShops,
      pendingShops,
      totalProducts,
      totalOrders,
      todayOrders,
      monthOrders,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      pendingOrders,
    ] = await Promise.all([
      // Users
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: today },
        },
      }),

      // Vendors
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'PENDING' } }),

      // Shops
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'PENDING' } }),

      // Products
      prisma.product.count(),

      // Orders
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),

      // Revenue
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: thisMonth },
        },
        _sum: { total: true },
      }),

      // Pending orders
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        shop: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              take: 1,
              select: { imageUrl: true },
            },
            shop: {
              select: { name: true },
            },
          },
        });
        return {
          ...product,
          totalSold: item._sum.quantity,
        };
      })
    );

    // Get sales by category
    const salesByCategory = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name_ar as "nameAr",
        COUNT(DISTINCT o.id) as "orderCount",
        SUM(o.total) as "totalRevenue"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'PAID'
      GROUP BY c.id, c.name_ar
      ORDER BY "totalRevenue" DESC NULLS LAST
    `;

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
      },
      vendors: {
        total: totalVendors,
        pending: pendingVendors,
      },
      shops: {
        total: totalShops,
        pending: pendingShops,
      },
      products: {
        total: totalProducts,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisMonth: monthOrders,
        pending: pendingOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        today: todayRevenue._sum.total || 0,
        thisMonth: monthRevenue._sum.total || 0,
      },
      recentOrders,
      topProducts: topProductsWithDetails,
      salesByCategory,
    };
  }

  // Get vendor dashboard statistics
  async getVendorDashboardStats(vendorId: string, shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalRevenue,
      todayRevenue,
      monthRevenue,
    ] = await Promise.all([
      // Products
      prisma.product.count({ where: { shopId } }),
      prisma.product.count({ where: { shopId, isActive: true } }),

      // Orders
      prisma.order.count({ where: { shopId } }),
      prisma.order.count({ where: { shopId, createdAt: { gte: today } } }),
      prisma.order.count({ where: { shopId, createdAt: { gte: thisMonth } } }),
      prisma.order.count({ where: { shopId, status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { shopId, status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { shopId, status: OrderStatus.DELIVERED } }),

      // Revenue
      prisma.order.aggregate({
        where: { shopId, paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          shopId,
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          shopId,
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: thisMonth },
        },
        _sum: { total: true },
      }),
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { shopId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    // Get top selling products for this shop
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { shopId },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              take: 1,
              select: { imageUrl: true },
            },
          },
        });
        return {
          ...product,
          totalSold: item._sum.quantity,
        };
      })
    );

    // Get daily sales for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as "orderCount",
        SUM(total) as revenue
      FROM orders
      WHERE shop_id = ${shopId}
        AND payment_status = 'PAID'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisMonth: monthOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        delivered: deliveredOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        today: todayRevenue._sum.total || 0,
        thisMonth: monthRevenue._sum.total || 0,
      },
      recentOrders,
      topProducts: topProductsWithDetails,
      dailySales,
    };
  }

  // Get sales chart data
  async getSalesChartData(shopId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      paymentStatus: PaymentStatus.PAID,
      createdAt: { gte: startDate },
    };

    if (shopId) {
      where.shopId = shopId;
    }

    const orders = await prisma.order.groupBy({
      by: ['createdAt'],
      where,
      _sum: { total: true },
      _count: { id: true },
    });

    // Format data for chart
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = orders.find(o => 
        o.createdAt.toISOString().split('T')[0] === dateStr
      );

      chartData.unshift({
        date: dateStr,
        revenue: dayData?._sum.total || 0,
        orders: dayData?._count.id || 0,
      });
    }

    return chartData;
  }

  // Get order status distribution
  async getOrderStatusDistribution(shopId?: string) {
    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }

    const distribution = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    return distribution.map(d => ({
      status: d.status,
      count: d._count.id,
    }));
  }

  // Get top customers
  async getTopCustomers(shopId?: string, limit: number = 10) {
    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }

    const topCustomers = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        ...where,
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const customersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        const user = await prisma.user.findUnique({
          where: { id: customer.userId },
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        });
        return {
          ...user,
          totalSpent: customer._sum.total,
          orderCount: customer._count.id,
        };
      })
    );

    return customersWithDetails;
  }

  // Get low stock products
  async getLowStockProducts(shopId?: string, threshold: number = 10) {
    const where: any = {
      stock: { lte: threshold },
      isActive: true,
    };

    if (shopId) {
      where.shopId = shopId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          take: 1,
          select: { imageUrl: true },
        },
        shop: {
          select: { name: true },
        },
      },
      orderBy: { stock: 'asc' },
      take: 20,
    });

    return products;
  }
}

export const analyticsService = new AnalyticsService();
