import { prisma } from '../index';
import { NotFoundError } from '../middleware/error.middleware';
import { NotificationType } from '../types';

export class NotificationService {
  // Create notification
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        isRead: false,
      },
    });

    // TODO: Send push notification if user has device tokens
    // TODO: Send email if user has email notifications enabled

    return notification;
  }

  // Create bulk notifications
  async createBulkNotifications(data: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    const notifications = await prisma.notification.createMany({
      data: data.userIds.map(userId => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        isRead: false,
      })),
    });

    return { count: notifications.count };
  }

  // Get user notifications
  async getUserNotifications(userId: string, options: {
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

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
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
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'تم تحديث جميع الإشعارات' };
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('الإشعار غير موجود');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'تم حذف الإشعار' };
  }

  // Delete old notifications (for cleanup)
  async deleteOldNotifications(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    return { count: result.count };
  }

  // Send order notification to user
  async sendOrderNotification(userId: string, orderId: string, orderNumber: string, status: string) {
    const statusMessages: Record<string, string> = {
      PENDING: 'تم استلام طلبك وهو قيد المراجعة',
      CONFIRMED: 'تم تأكيد طلبك',
      PREPARING: 'جاري تحضير طلبك',
      READY: 'طلبك جاهز للاستلام',
      OUT_FOR_DELIVERY: 'طلبك في الطريق إليك',
      DELIVERED: 'تم توصيل طلبك بنجاح',
      CANCELLED: 'تم إلغاء طلبك',
    };

    return this.createNotification({
      userId,
      type: NotificationType.ORDER,
      title: 'تحديث الطلب',
      message: statusMessages[status] || `تم تحديث حالة طلبك رقم ${orderNumber}`,
      data: { orderId, orderNumber, status },
    });
  }

  // Send order notification to vendor
  async sendVendorOrderNotification(vendorId: string, orderId: string, orderNumber: string) {
    return this.createNotification({
      userId: vendorId,
      type: NotificationType.ORDER,
      title: 'طلب جديد',
      message: `لديك طلب جديد برقم ${orderNumber}`,
      data: { orderId, orderNumber },
    });
  }

  // Send promotional notification
  async sendPromotionalNotification(userIds: string[], title: string, message: string, data?: any) {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.PROMOTION,
      title,
      message,
      data,
    });
  }

  // Send system notification
  async sendSystemNotification(userIds: string[], title: string, message: string, data?: any) {
    return this.createBulkNotifications({
      userIds,
      type: NotificationType.SYSTEM,
      title,
      message,
      data,
    });
  }

  // Get notification preferences (placeholder for future implementation)
  async getNotificationPreferences(userId: string) {
    // TODO: Implement notification preferences
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      orderUpdates: true,
      promotions: true,
      systemUpdates: true,
    };
  }

  // Update notification preferences (placeholder for future implementation)
  async updateNotificationPreferences(userId: string, preferences: any) {
    // TODO: Implement notification preferences update
    return { message: 'تم تحديث التفضيلات' };
  }
}

export const notificationService = new NotificationService();
