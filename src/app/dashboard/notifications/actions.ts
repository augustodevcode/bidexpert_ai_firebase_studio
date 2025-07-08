// src/app/dashboard/notifications/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Notification } from '@/types';

/**
 * Fetches notifications for a specific user.
 * @param userId - The ID of the user whose notifications to fetch.
 * @returns A promise that resolves to an array of Notification objects.
 */
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  if (!userId) {
    console.warn("[Action - getNotificationsForUser] No userId provided.");
    return [];
  }
  
  try {
    const db = await getDatabaseAdapter();
    const notifications = await db.getNotificationsForUser(userId);
    return notifications;
  } catch (error) {
    console.error(`[Action - getNotificationsForUser] Error fetching notifications for user ${userId}:`, error);
    return [];
  }
}

/**
 * Fetches the count of unread notifications for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the number of unread notifications.
 */
export async function getUnreadNotificationCountAction(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const db = await getDatabaseAdapter();
    return await db.getUnreadNotificationCount(userId);
  } catch (error) {
    console.error(`[Action - getUnreadNotificationCountAction] Error for user ${userId}:`, error);
    return 0;
  }
}


// In a real app, you would also have actions to mark notifications as read
export async function markNotificationAsRead(notificationId: string): Promise<{success: boolean}> {
    console.log(`[Action - markNotificationAsRead] Marking notification ${notificationId} as read. (Placeholder)`);
    // Here you would call the database adapter to update the notification status.
    return { success: true };
}
