// src/app/contact/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { ContactMessageService } from '@bidexpert/services';

const contactMessageService = new ContactMessageService();

/**
 * Saves a message sent from the public contact form to the database.
 * @param {FormData} formData - The form data containing name, email, subject, and message.
 * @returns {Promise<{success: boolean; message: string}>} An object indicating the result of the operation.
 */
export async function saveContactMessage(formData: FormData): Promise<{ success: boolean; message: string }> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !subject || !message) {
    return { success: false, message: 'Todos os campos são obrigatórios.' };
  }

  const result = await contactMessageService.saveMessage({ name, email, subject, message });

  if (result.success) {
    revalidatePath('/admin/contact-messages');
    return { success: true, message: 'Sua mensagem foi enviada com sucesso!' };
  } else {
    return result;
  }
}
