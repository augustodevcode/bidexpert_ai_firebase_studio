// src/services/email-log.service.ts
/**
 * @fileoverview Serviço para gerenciamento de logs de e-mail.
 * Este arquivo contém a classe EmailLogService, que encapsula
 * a lógica de negócio para logs de envio de e-mail.
 */
import { EmailLogRepository } from '@/repositories/email-log.repository';
import type { EmailLog, EmailStatus } from '@prisma/client';

export class EmailLogService {
  private repository: EmailLogRepository;

  constructor() {
    this.repository = new EmailLogRepository();
  }

  async createLog(data: {
    recipient: string;
    subject: string;
    content: string;
    provider: string;
    contactMessageId?: bigint;
  }): Promise<EmailLog> {
    return await this.repository.create(data);
  }

  async updateLogStatus(
    id: bigint,
    status: EmailStatus,
    errorMessage?: string
  ): Promise<EmailLog> {
    const sentAt = status === 'SENT' ? new Date() : undefined;
    return await this.repository.updateStatus(id, status, errorMessage, sentAt);
  }

  async getEmailLogs(limit = 50, offset = 0): Promise<EmailLog[]> {
    return await this.repository.findAll(limit, offset);
  }

  async getLogsByContactMessage(contactMessageId: bigint): Promise<EmailLog[]> {
    return await this.repository.findByContactMessageId(contactMessageId);
  }

  async getEmailStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    return await this.repository.getStats();
  }
}