// src/app/admin/contact-messages/actions.ts
/**
 * @fileoverview Server Actions para a entidade ContactMessage.
 * Este arquivo exporta as funções que permitem ao painel de administração
 * interagir com as mensagens enviadas pelo formulário de contato público.
 * As ações incluem buscar, marcar como lida e excluir mensagens, delegando
 * a lógica de negócio para o `ContactMessageService`.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { ContactMessage } from '@/types';
import { ContactMessageService } from '@/services/contact-message.service';
import { z } from 'zod';

const contactMessageService = new ContactMessageService();

/**
 * Fetches all contact messages from the database.
 * @returns {Promise<ContactMessage[]>} An array of all contact messages.
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  return contactMessageService.getContactMessages();
}

/**
 * Toggles the read status of a specific contact message.
 * @param {string} id - The ID of the message.
 * @param {boolean} isRead - The new read status.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function toggleMessageReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    const result = await contactMessageService.toggleReadStatus(id, isRead);
    if (result.success && process.env.NODE_ENV !== 'test') {
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
  const result = await contactMessageService.deleteMessage(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/contact-messages');
  }
  return result;
}

const replySchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(3, 'Assunto é obrigatório'),
  message: z.string().min(3, 'Mensagem é obrigatória'),
});

/**
 * Sends a reply to a contact message using configured SMTP/SendGrid.
 * @param {string} id - The ID of the contact message.
 * @param {string} subject - Reply subject.
 * @param {string} message - Reply body.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function sendContactMessageReply(
  id: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  const parsed = replySchema.safeParse({ id, subject, message });
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || 'Dados inválidos.' };
  }

  const result = await contactMessageService.sendReplyToContactMessage(id, { subject, message });
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/contact-messages');
    revalidatePath('/admin/email-logs');
  }
  return result;
}
