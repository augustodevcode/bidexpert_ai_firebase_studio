// src/services/document.service.ts
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
        userId,
        documentTypeId,
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
}
