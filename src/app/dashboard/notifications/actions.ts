// src/app/dashboard/notifications/actions.ts
/**
 * @fileoverview Server Actions for managing user Notifications.
 * This file acts as a controller, delegating logic to the NotificationService.
 */
'use server';

import { NotificationService } from '@bidexpert/services';
import type { Notification } from '@bidexpert/core';

const notificationService = new NotificationService();

/**
 * Fetches notifications for a specific user.
 * @param {string} userId - The ID of the user whose notifications to fetch.
 * @returns {Promise<Notification[]>} A promise that resolves to an array of Notification objects.
 */
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  return notificationService.getNotificationsForUser(userId);
}

/**
 * Fetches the count of unread notifications for a specific user.
 * @param {string} userId The ID of the user.
 * @returns {Promise<number>} A promise that resolves to the number of unread notifications.
 */
export async function getUnreadNotificationCountAction(userId: string): Promise<number> {
  return notificationService.getUnreadNotificationCount(userId);
}

/**
 * Marks a specific notification as read for a given user.
 * @param {string} notificationId The ID of the notification to mark as read.
 * @param {string} userId The ID of the user who owns the notification.
 * @returns {Promise<{success: boolean; message?: string}>} An object indicating success or failure.
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<{success: boolean; message?: string}> {
  return notificationService.markNotificationAsRead(notificationId, userId);
}
