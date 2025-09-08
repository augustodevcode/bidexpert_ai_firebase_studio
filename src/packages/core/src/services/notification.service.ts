// packages/core/src/services/notification.service.ts
import { NotificationRepository } from '../repositories/notification.repository';
import type { Notification } from '@bidexpert/core';
import { revalidatePath } from 'next/cache';

export class NotificationService {
  private repository: NotificationRepository;

  constructor() {
    this.repository = new NotificationRepository();
  }
  
  async createNotification(data: { userId: string; message: string; link?: string }): Promise<Notification | null> {
    try {
      return await this.repository.create(data);
    } catch(e) {
      console.error("[NotificationService] Failed to create notification:", e);
      return null;
    }
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    if (!userId) {
      console.warn("[NotificationService] getNotificationsForUser called without a userId.");
      return [];
    }
    return this.repository.findByUserId(userId);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) {
      return 0;
    }
    return this.repository.countUnread(userId);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    if (!notificationId || !userId) {
      return { success: false, message: "ID da notificação ou do usuário não fornecido." };
    }

    try {
      const updatedNotification = await this.repository.updateAsRead(notificationId, userId);
      
      if (!updatedNotification) {
          return { success: false, message: "Notificação não encontrada ou não pertence a este usuário." };
      }

      if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/dashboard/notifications');
      }
      return { success: true, message: "Notificação marcada como lida." };
    } catch (error: any) {
      console.error(`[NotificationService] Error marking notification as read for id ${notificationId}:`, error);
      return { success: false, message: "Falha ao marcar notificação como lida." };
    }
  }
}
