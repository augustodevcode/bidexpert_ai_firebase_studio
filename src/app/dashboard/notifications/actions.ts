/**
 * @fileoverview Server Actions for managing user Notifications.
 * Provides functions to fetch notifications for a user, get the count of unread notifications,
 * and mark specific notifications as read.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database/index';
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
  const db = await getDatabaseAdapter();
  // @ts-ignore
  return db.getNotificationsForUser ? db.getNotificationsForUser(userId) : [];
}

/**
 * Fetches the count of unread notifications for a specific user.
 * @param {string} userId The ID of the user.
 * @returns {Promise<number>} A promise that resolves to the number of unread notifications.
 */
export async function getUnreadNotificationCountAction(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const notifications = await getNotificationsForUser(userId);
    return notifications.filter(n => !n.isRead).length;
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
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.markNotificationAsRead) {
      return { success: false, message: "Função não implementada para este adaptador." };
    }
    
    // @ts-ignore
    const result = await db.markNotificationAsRead(notificationId, userId);

    if (result.success) {
        revalidatePath('/dashboard/notifications');
    }

    return result;
}
