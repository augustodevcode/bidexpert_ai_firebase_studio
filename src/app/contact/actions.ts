// src/app/contact/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import { revalidatePath } from 'next/cache';

/**
 * Saves a message sent from the public contact form to the database.
 * @param {FormData} formData - The form data containing name, email, subject, and message.
 * @returns {Promise<{success: boolean; message: string}>} An object indicating the result of the operation.
 */
export async function saveContactMessage(formData: FormData): Promise<{ success: boolean; message: string }> {
  // Extract data from the form
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return { success: false, message: 'Todos os campos são obrigatórios.' };
  }

  try {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.saveContactMessage) {
        return { success: false, message: "Função não implementada para este adaptador."};
    }
    // @ts-ignore
    const result = await db.saveContactMessage({ name, email, subject, message });

    // Revalidate the path for the admin page where messages are viewed
    if (result.success) {
        revalidatePath('/admin/contact-messages');
    }
    
    return result;
  } catch (error) {
    console.error("Error saving contact message:", error);
    return { success: false, message: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.' };
  }
}
