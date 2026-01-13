// src/app/dashboard/messages/actions.ts
/**
 * @fileoverview Ações do servidor para a página de mensagens do usuário.
 * Fornece funcionalidades para recuperar mensagens de contato associadas ao usuário logado.
 */
'use server';

import { auth } from '@/lib/auth';
import { getUserContactMessages as getUserContactMessagesService } from '@/services/contact-message.service';
import { redirect } from 'next/navigation';

/**
 * Recupera todas as mensagens de contato associadas ao usuário logado.
 * Inclui informações sobre o status de envio de e-mail para cada mensagem.
 *
 * @returns Lista de mensagens de contato com logs de e-mail
 * @throws Error se o usuário não estiver autenticado
 */
export async function getUserContactMessages() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  try {
    const messages = await getUserContactMessagesService(session.user.id);
    return messages;
  } catch (error: any) {
    console.error('Erro ao buscar mensagens do usuário:', error);
    throw new Error('Não foi possível carregar suas mensagens. Tente novamente.');
  }
}