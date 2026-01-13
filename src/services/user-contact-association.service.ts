// src/services/user-contact-association.service.ts
/**
 * @fileoverview Serviço para associar mensagens de contato anônimas a usuários.
 * Quando um usuário se cadastra, este serviço verifica se existem mensagens
 * de contato enviadas com o mesmo e-mail e as associa ao usuário.
 */
import { prisma } from '@/lib/prisma';

export class UserContactAssociationService {
  /**
   * Associa mensagens de contato anônimas ao usuário recém-cadastrado.
   * @param userId - ID do usuário recém-cadastrado
   * @param userEmail - E-mail do usuário
   * @returns Número de mensagens associadas
   */
  async associateContactMessages(userId: bigint, userEmail: string): Promise<number> {
    try {
      // Buscar mensagens de contato não associadas com o mesmo e-mail
      const unassociatedMessages = await prisma.contactMessage.findMany({
        where: {
          email: userEmail,
          userId: null, // Apenas mensagens não associadas
        },
      });

      if (unassociatedMessages.length === 0) {
        return 0;
      }

      // Associar as mensagens ao usuário
      const result = await prisma.contactMessage.updateMany({
        where: {
          email: userEmail,
          userId: null,
        },
        data: {
          userId,
          updatedAt: new Date(),
        },
      });

      console.log(`Associadas ${result.count} mensagens de contato ao usuário ${userId} (${userEmail})`);

      return result.count;
    } catch (error: any) {
      console.error('Erro ao associar mensagens de contato:', error);
      throw new Error(`Falha ao associar mensagens de contato: ${error.message}`);
    }
  }

  /**
   * Busca mensagens de contato associadas a um usuário.
   * @param userId - ID do usuário
   * @returns Lista de mensagens de contato do usuário
   */
  async getUserContactMessages(userId: bigint) {
    return await prisma.contactMessage.findMany({
      where: {
        userId,
      },
      include: {
        emailLogs: {
          select: {
            id: true,
            status: true,
            sentAt: true,
            provider: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Verifica se um usuário tem mensagens de contato associadas.
   * @param userId - ID do usuário
   * @returns Número de mensagens associadas
   */
  async getUserContactMessagesCount(userId: bigint): Promise<number> {
    return await prisma.contactMessage.count({
      where: {
        userId,
      },
    });
  }
}