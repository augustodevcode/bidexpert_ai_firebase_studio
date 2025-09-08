// src/services/habilitation.service.ts
import { HabilitationRepository } from '@/repositories/habilitation.repository';
import { UserService } from './user.service';
import type { UserProfileData, UserDocument } from '@/types';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma'; // Import prisma directly for specific checks not in repo

export class HabilitationService {
  private repository: HabilitationRepository;
  private userService: UserService;

  constructor() {
    this.repository = new HabilitationRepository();
    this.userService = new UserService();
  }

  async getHabilitationRequests(): Promise<UserProfileData[]> {
    return this.repository.findHabilitationRequests();
  }

  async habilitateForAuction(userId: string, auctionId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.createOrUpdateAuctionHabilitation(userId, auctionId);
      if (process.env.NODE_ENV !== 'test') {
        revalidatePath(`/auctions/${auctionId}`);
      }
      return { success: true, message: 'Você foi habilitado para este leilão com sucesso!' };
    } catch (e: any) {
      console.error(`Failed to habilitate user ${userId} for auction ${auctionId}:`, e);
      return { success: false, message: `Não foi possível completar sua habilitação para este leilão. ${e.message}` };
    }
  }

  async isUserHabilitatedForAuction(userId: string, auctionId: string): Promise<boolean> {
    if (!userId || !auctionId) return false;
    return this.repository.checkAuctionHabilitation(userId, auctionId);
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    return this.repository.findUserDocuments(userId);
  }
  
  async saveUserDocument(
    userId: string,
    documentTypeId: string,
    fileUrl: string,
    fileName: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!userId || !documentTypeId || !fileUrl) {
      return { success: false, message: "Dados insuficientes para salvar o documento." };
    }
    try {
      await this.repository.createOrUpdateUserDocument(userId, documentTypeId, fileUrl, fileName);

      // After saving, check if the user status should be updated
      await this.userService.checkAndHabilitateUser(userId);
      
      if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/dashboard/documents');
        revalidatePath(`/admin/habilitations/${userId}`);
      }

      return { success: true, message: "Documento salvo com sucesso." };
    } catch (error: any) {
      console.error("Error saving user document:", error);
      return { success: false, message: `Falha ao salvar documento: ${error.message}`};
    }
  }

  async approveDocument(documentId: string, analystId: string): Promise<{ success: boolean; message: string }> {
    try {
      const docToUpdate = await this.repository.findDocumentById(documentId);
      if (!docToUpdate) {
        throw new Error("Documento não encontrado.");
      }

      await this.repository.updateDocumentStatus(documentId, 'APPROVED', null);

      // After approval, check if the user is now fully habilitated
      await this.userService.checkAndHabilitateUser(docToUpdate.userId);

      if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
      }
      return { success: true, message: 'Documento aprovado.' };
    } catch (e: any) {
      console.error(`Error approving document ${documentId}:`, e);
      return { success: false, message: `Falha ao aprovar documento: ${e.message}` };
    }
  }

  async rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
    if (!reason) {
      return { success: false, message: 'O motivo da rejeição é obrigatório.' };
    }
    try {
      const docToUpdate = await this.repository.findDocumentById(documentId);
      if (!docToUpdate) {
        throw new Error("Documento não encontrado.");
      }

      await this.repository.updateDocumentStatus(documentId, 'REJECTED', reason);
      await this.userService.updateHabilitationStatus(docToUpdate.userId, 'REJECTED_DOCUMENTS');

      if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
      }
      return { success: true, message: 'Documento rejeitado.' };
    } catch (e: any) {
      return { success: false, message: 'Falha ao rejeitar documento.' };
    }
  }
}
