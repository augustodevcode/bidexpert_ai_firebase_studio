// src/app/admin/contact-messages/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { ContactMessage } from '@/types';

/**
 * Fetches all contact messages from the database.
 * @returns {Promise<ContactMessage[]>} An array of all contact messages.
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }});
}

/**
 * Toggles the read status of a specific contact message.
 * @param {string} id - The ID of the message.
 * @param {boolean} isRead - The new read status.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function toggleMessageReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    try {
        await prisma.contactMessage.update({
            where: { id },
            data: { isRead }
        });
        revalidatePath('/admin/contact-messages');
        return { success: true, message: `Mensagem marcada como ${isRead ? 'lida' : 'não lida'}.`};
    } catch (error: any) {
        return { success: false, message: "Falha ao atualizar status da mensagem." };
    }
}

/**
 * Deletes a contact message from the database.
 * @param {string} id - The ID of the message to delete.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function deleteContactMessage(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.contactMessage.delete({ where: { id } });
    revalidatePath('/admin/contact-messages');
    return { success: true, message: "Mensagem excluída." };
  } catch (error: any) {
    return { success: false, message: "Falha ao excluir mensagem." };
  }
}
