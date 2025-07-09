// src/app/contact/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
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
    // Create a new record in the ContactMessage table
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        isRead: false, // Default to unread
      },
    });

    // Revalidate the path for the admin page where messages are viewed
    revalidatePath('/admin/contact-messages');
    
    return { success: true, message: 'Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.' };
  } catch (error) {
    console.error("Error saving contact message:", error);
    return { success: false, message: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.' };
  }
}
