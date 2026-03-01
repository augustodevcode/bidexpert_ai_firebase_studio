// src/services/contact-message.service.ts
/**
 * @fileoverview Este arquivo contém a classe ContactMessageService, que encapsula
 * a lógica de negócio para o gerenciamento de mensagens de contato. Ele serve como
 * intermediário entre as actions e o repositório, permitindo salvar, buscar,
 * atualizar o status de leitura e excluir mensagens enviadas pelo formulário público.
 */
import { ContactMessageRepository } from '@/repositories/contact-message.repository';
import type { ContactMessage } from '@/types';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { EmailService } from './email.service';

export class ContactMessageService {
  private repository: ContactMessageRepository;
  private prisma;
  private emailService: EmailService;

  constructor() {
    this.repository = new ContactMessageRepository();
    this.prisma = prisma;
    this.emailService = new EmailService();
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    const messages = await this.repository.findAll();
    return messages.map((m: any) => ({ ...m, id: m.id.toString() }));
  }

  async saveMessage(data: Prisma.ContactMessageCreateInput): Promise<{ success: boolean; message: string; }> {
    try {
      const savedMessage = await this.repository.create(data);

      // Enviar e-mail de notificação
      const emailResult = await this.emailService.sendContactMessage({
        name: data.name as string,
        email: data.email as string,
        subject: data.subject as string,
        message: data.message as string,
        contactMessageId: savedMessage.id, // Passar o ID da mensagem salva
      });

      if (!emailResult.success) {
        console.warn('Mensagem salva, mas falha no envio de e-mail:', emailResult.message);
        // Não falha a operação se o e-mail não for enviado, apenas loga o warning
      }

      return { success: true, message: 'Mensagem salva com sucesso.' };
    } catch (error: any) {
      console.error("Error in ContactMessageService.saveMessage:", error);
      return { success: false, message: `Falha ao salvar mensagem: ${error.message}` };
    }
  }

  async toggleReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.update(BigInt(id), { isRead });
      return { success: true, message: `Status da mensagem atualizado.` };
    } catch (error: any) {
      return { success: false, message: "Falha ao atualizar status da mensagem." };
    }
  }

  async deleteMessage(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.delete(BigInt(id));
      return { success: true, message: "Mensagem excluída." };
    } catch (error: any) {
      return { success: false, message: "Falha ao excluir mensagem." };
    }
  }

  async deleteAllContactMessages(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.prisma.contactMessage.deleteMany({});
      return { success: true, message: 'Todas as mensagens de contato foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as mensagens de contato.' };
    }
  }

  async sendReplyToContactMessage(
    id: string,
    data: { subject: string; message: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const contactMessage = await this.repository.findById(BigInt(id));
      if (!contactMessage) {
        return { success: false, message: 'Mensagem de contato não encontrada.' };
      }

      const subject = data.subject?.trim()
        ? data.subject
        : `Re: ${contactMessage.subject || 'Mensagem de Contato'}`;

      return await this.emailService.sendContactMessageReply({
        to: contactMessage.email,
        name: contactMessage.name,
        subject,
        message: data.message,
        originalMessage: contactMessage.message,
        contactMessageId: contactMessage.id,
      });
    } catch (error: any) {
      console.error('Erro ao enviar resposta de contato:', error);
      return { success: false, message: 'Falha ao enviar resposta da mensagem.' };
    }
  }

  /**
   * Recupera todas as mensagens de contato associadas a um usuário específico.
   * Inclui os logs de e-mail relacionados para mostrar o status de envio.
   *
   * @param userId ID do usuário
   * @returns Lista de mensagens com logs de e-mail
   */
  async getUserContactMessages(userId: string) {
    try {
      const messages = await this.prisma.contactMessage.findMany({
        where: {
          userId: userId,
        },
        include: {
          emailLogs: {
            orderBy: {
              createdAt: 'desc', // Mais recente primeiro
            },
            take: 1, // Apenas o log mais recente
          },
        },
        orderBy: {
          createdAt: 'desc', // Mais recentes primeiro
        },
      });

      // Converter BigInt para string para compatibilidade com JSON
      return messages.map((message: any) => ({
        ...message,
        id: message.id.toString(),
        emailLogs: message.emailLogs.map((log: any) => ({
          ...log,
          id: log.id.toString(),
        })),
      }));
    } catch (error: any) {
      console.error('Erro ao buscar mensagens do usuário:', error);
      throw new Error('Falha ao recuperar mensagens do usuário.');
    }
  }
}

// Instância singleton do serviço
const contactMessageService = new ContactMessageService();

// Funções exportadas para uso nas actions
export const getContactMessages = () => contactMessageService.getContactMessages();
export const saveContactMessage = (data: Prisma.ContactMessageCreateInput) => contactMessageService.saveMessage(data);
export const toggleContactMessageReadStatus = (id: string, isRead: boolean) => contactMessageService.toggleReadStatus(id, isRead);
export const deleteContactMessage = (id: string) => contactMessageService.deleteMessage(id);
export const deleteAllContactMessages = () => contactMessageService.deleteAllContactMessages();
export const getUserContactMessages = (userId: string) => contactMessageService.getUserContactMessages(userId);
export const sendReplyToContactMessage = (id: string, data: { subject: string; message: string }) => contactMessageService.sendReplyToContactMessage(id, data);
