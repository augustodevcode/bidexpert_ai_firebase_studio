// src/services/document.service.ts
/**
 * @fileoverview Este arquivo contém a classe DocumentService, responsável
 * pela lógica de negócio relacionada aos documentos dos usuários. Ele gerencia
 * o processo de habilitação, verificando se um usuário enviou todos os
 * documentos necessários e atualizando seu status de habilitação na plataforma.
 */
import { DocumentRepository } from '@/repositories/document.repository';
import { UserService } from './user.service';
import type { DocumentType, UserDocument } from '@/types';

export class DocumentService {
  private repository: DocumentRepository;
  private userService: UserService;

  constructor() {
    this.repository = new DocumentRepository();
    this.userService = new UserService();
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    return this.repository.findAllTypes();
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    return this.repository.findUserDocumentsByUserId(userId);
  }

  async saveUserDocument(
    userId: string,
    documentTypeId: string,
    fileUrl: string,
    fileName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.upsertUserDocument({
        userId: BigInt(userId),
        documentTypeId: BigInt(documentTypeId),
        fileUrl,
        fileName,
        status: 'PENDING_ANALYSIS',
        rejectionReason: null,
      });

      // After saving, trigger the habilitation status check
      await this.userService.checkAndHabilitateUser(userId);

      return { success: true, message: "Documento salvo com sucesso e enviado para análise." };
    } catch (error: any) {
      console.error("Error in DocumentService.saveUserDocument:", error);
      return { success: false, message: `Falha ao salvar documento: ${error.message}` };
    }
  }

  async adminUpdateUserDocumentStatus(
    userId: string,
    documentTypeId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updatedDoc = await this.repository.updateUserDocumentStatus(
        userId,
        documentTypeId,
        status,
        rejectionReason
      );

      if (!updatedDoc) {
        return { success: false, message: "Documento do usuário não encontrado." };
      }

      // After updating, trigger the habilitation status check
      await this.userService.checkAndHabilitateUser(userId);

      return { success: true, message: `Status do documento atualizado para ${status}.` };
    } catch (error: any) {
      console.error("Error in DocumentService.adminUpdateUserDocumentStatus:", error);
      return { success: false, message: `Falha ao atualizar status do documento: ${error.message}` };
    }
  }

  /**
   * @description Método de helper APENAS para o script de seed.
   * Aprova um documento e dispara a checagem de habilitação.
   */
  async approveDocumentForSeed(userId: string, documentTypeId: string): Promise<void> {
    await this.adminUpdateUserDocumentStatus(userId, documentTypeId, 'APPROVED');
  }

  async deleteAllUserDocuments(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAllUserDocuments();
      return { success: true, message: 'Todos os documentos de usuários foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os documentos de usuários.' };
    }
  }

  async deleteAllDocuments(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAllDocuments();
      return { success: true, message: 'Todos os documentos foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os documentos.' };
    }
  }
}
