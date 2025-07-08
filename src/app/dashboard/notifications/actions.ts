/**
 * @fileoverview Server Actions for managing user Notifications.
 * Provides functions to fetch notifications for a user, get the count of unread notifications,
 * and mark specific notifications as read.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Notification } from '@/types';

/**
 * Fetches notifications for a specific user.
 * @param {string} userId - The ID of the user whose notifications to fetch.
 * @returns {Promise<Notification[]>} A promise that resolves to an array of Notification objects.
 */
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  if (!userId) {
    console.warn("[Action - getNotificationsForUser] No userId provided.");
    return [];
  }
  
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications as unknown as Notification[];
  } catch (error) {
    console.error(`[Action - getNotificationsForUser] Error fetching notifications for user ${userId}:`, error);
    return [];
  }
}

/**
 * Fetches the count of unread notifications for a specific user.
 * @param {string} userId The ID of the user.
 * @returns {Promise<number>} A promise that resolves to the number of unread notifications.
 */
export async function getUnreadNotificationCountAction(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const count = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    console.error(`[Action - getUnreadNotificationCountAction] Error for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Marks a specific notification as read for a given user.
 * @param {string} notificationId The ID of the notification to mark as read.
 * @param {string} userId The ID of the user who owns the notification.
 * @returns {Promise<{success: boolean; message?: string}>} An object indicating success or failure.
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<{success: boolean; message?: string}> {
    if (!notificationId || !userId) {
        return { success: false, message: "ID da notificação ou do usuário não fornecido."};
    }
    
    try {
        const result = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: userId, // Security check: user can only mark their own notifications
            },
            data: {
                isRead: true,
            },
        });

        if (result.count > 0) {
            revalidatePath('/dashboard/notifications');
            return { success: true, message: "Notificação marcada como lida." };
        } else {
            return { success: false, message: "Notificação não encontrada ou não pertence ao usuário." };
        }
    } catch (error: any) {
        console.error(`[Action - markNotificationAsRead] Error for notification ${notificationId}:`, error);
        return { success: false, message: "Falha ao marcar notificação como lida." };
    }
}
