// src/app/admin/email-logs/actions.ts
/**
 * @fileoverview Server Actions para gerenciamento de logs de e-mail.
 * Permite ao analista de TI consultar os logs de envio de e-mail.
 */
'use server';

import { EmailLogService } from '@/services/email-log.service';
import type { EmailLog } from '@prisma/client';

const emailLogService = new EmailLogService();

/**
 * Busca todos os logs de e-mail com paginação.
 * @param limit - Número máximo de registros (padrão: 50)
 * @param offset - Deslocamento para paginação (padrão: 0)
 * @returns Lista de logs de e-mail
 */
export async function getEmailLogs(limit = 50, offset = 0): Promise<EmailLog[]> {
  return await emailLogService.getEmailLogs(limit, offset);
}

/**
 * Busca estatísticas dos logs de e-mail.
 * @returns Estatísticas de envio de e-mail
 */
export async function getEmailStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
}> {
  return await emailLogService.getEmailStats();
}

/**
 * Busca logs de e-mail relacionados a uma mensagem de contato específica.
 * @param contactMessageId - ID da mensagem de contato
 * @returns Logs de e-mail relacionados
 */
export async function getEmailLogsByContactMessage(contactMessageId: bigint): Promise<EmailLog[]> {
  return await emailLogService.getLogsByContactMessage(contactMessageId);
}