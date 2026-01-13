// src/repositories/email-log.repository.ts
/**
 * @fileoverview Repositório para gerenciamento de logs de e-mail.
 * Este arquivo contém a classe EmailLogRepository, que encapsula
 * as operações de banco de dados para a tabela EmailLog.
 */
import { prisma } from '@/lib/prisma';
import type { EmailLog, EmailStatus } from '@prisma/client';

export class EmailLogRepository {
  async create(data: {
    recipient: string;
    subject: string;
    content: string;
    provider: string;
    status?: EmailStatus;
    contactMessageId?: bigint;
  }): Promise<EmailLog> {
    return await prisma.emailLog.create({
      data: {
        recipient: data.recipient,
        subject: data.subject,
        content: data.content,
        provider: data.provider,
        status: data.status || 'PENDING',
        contactMessageId: data.contactMessageId,
      },
    });
  }

  async updateStatus(
    id: bigint,
    status: EmailStatus,
    errorMessage?: string,
    sentAt?: Date
  ): Promise<EmailLog> {
    return await prisma.emailLog.update({
      where: { id },
      data: {
        status,
        errorMessage,
        sentAt,
        updatedAt: new Date(),
      },
    });
  }

  async findAll(limit?: number, offset?: number): Promise<EmailLog[]> {
    return await prisma.emailLog.findMany({
      include: {
        contactMessage: {
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByContactMessageId(contactMessageId: bigint): Promise<EmailLog[]> {
    return await prisma.emailLog.findMany({
      where: { contactMessageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    const [total, sent, failed, pending] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { status: 'PENDING' } }),
    ]);

    return { total, sent, failed, pending };
  }
}