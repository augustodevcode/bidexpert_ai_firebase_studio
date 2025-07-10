// src/app/admin/contact-messages/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { ContactMessage } from '@/types';

/**
 * Fetches all contact messages from the database.
 * @returns {Promise<ContactMessage[]>} An array of all contact messages.
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore - Assuming this method exists on the adapter
  return db.getContactMessages ? db.getContactMessages() : [];
}

/**
 * Toggles the read status of a specific contact message.
 * @param {string} id - The ID of the message.
 * @param {boolean} isRead - The new read status.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function toggleMessageReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore - Assuming this method exists on the adapter
    if (!db.toggleMessageReadStatus) {
        return { success: false, message: "Função não implementada neste adaptador." };
    }
    // @ts-ignore
    const result = await db.toggleMessageReadStatus(id, isRead);
    if (result.success) {
        revalidatePath('/admin/contact-messages');
    }
    return result;
}

/**
 * Deletes a contact message from the database.
 * @param {string} id - The ID of the message to delete.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function deleteContactMessage(id: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  // @ts-ignore - Assuming this method exists on the adapter
  if (!db.deleteContactMessage) {
        return { success: false, message: "Função não implementada neste adaptador." };
  }
  // @ts-ignore
  const result = await db.deleteContactMessage(id);
  if (result.success) {
    revalidatePath('/admin/contact-messages');
  }
  return result;
}
