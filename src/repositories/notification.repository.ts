// src/repositories/notification.repository.ts
import { prisma } from '@/lib/prisma';
import type { Notification } from '@bidexpert/core';

export class NotificationRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async updateAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId: userId, // Ensure users can only update their own notifications
      },
      data: { isRead: true },
    });
  }
}
