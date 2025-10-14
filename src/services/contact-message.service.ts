// src/services/contact-message.service.ts
/**
 * @fileoverview Este arquivo contém a classe ContactMessageService, que encapsula
 * a lógica de negócio para o gerenciamento de mensagens de contato. Ele serve como
 * intermediário entre as actions e o repositório, permitindo salvar, buscar,
 * atualizar o status de leitura e excluir mensagens enviadas pelo formulário público.
 */
import { ContactMessageRepository } from '@/repositories/contact-message.repository';
import type { ContactMessage } from '@/types';

export class ContactMessageService {
  private repository: ContactMessageRepository;

  constructor() {
    this.repository = new ContactMessageRepository();
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return this.repository.findAll();
  }

  async saveMessage(data: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead' | 'tenantId'>): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.create(data);
      return { success: true, message: 'Mensagem salva com sucesso.' };
    } catch (error: any) {
      console.error("Error in ContactMessageService.saveMessage:", error);
      return { success: false, message: `Falha ao salvar mensagem: ${error.message}` };
    }
  }

  async toggleReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.update(id, { isRead });
      return { success: true, message: `Status da mensagem atualizado.` };
    } catch (error: any) {
      return { success: false, message: "Falha ao atualizar status da mensagem." };
    }
  }

  async deleteMessage(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: "Mensagem excluída." };
    } catch (error: any) {
      return { success: false, message: "Falha ao excluir mensagem." };
    }
  }

  async deleteAllContactMessages(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAll();
      return { success: true, message: 'Todas as mensagens de contato foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as mensagens de contato.' };
    }
  }
}
