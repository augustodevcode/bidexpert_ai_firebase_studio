// packages/core/src/services/habilitation.service.ts
import { HabilitationRepository } from '../repositories/habilitation.repository';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { DocumentTypeRepository } from '../repositories/document-type.repository';
import type { UserProfileData, UserDocument } from '../types';
import { revalidatePath } from 'next/cache';

export class HabilitationService {
  private repository: HabilitationRepository;
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private docTypeRepository: DocumentTypeRepository;


  constructor() {
    this.repository = new HabilitationRepository();
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.docTypeRepository = new DocumentTypeRepository();
  }

  private formatUser(user: any): UserProfileData | null {
    if (!user) return null;
    return {
      ...user,
      id: user.id,
      uid: user.id,
    };
  }

  async getHabilitationRequests(): Promise<UserProfileData[]> {
    const users = await this.repository.findHabilitationRequests();
    return users.map(u => this.formatUser(u)).filter(Boolean) as UserProfileData[];
  }

  async habilitateForAuction(userId: string, auctionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || user.habilitationStatus !== 'HABILITADO') {
        return { success: false, message: "Apenas usuários com cadastro aprovado podem se habilitar em leilões." };
      }
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
      await this.checkAndHabilitateUser(userId);
      
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
      await this.checkAndHabilitateUser(docToUpdate.userId);

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
      await this.userRepository.update(docToUpdate.userId, { habilitationStatus: 'REJECTED_DOCUMENTS' });

      if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
      }
      return { success: true, message: 'Documento rejeitado.' };
    } catch (e: any) {
      return { success: false, message: 'Falha ao rejeitar documento.' };
    }
  }
  
   async checkAndHabilitateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.habilitationStatus === 'HABILITADO') return;

    const userDocuments = await this.repository.findUserDocuments(userId);
    const requiredDocTypes = await this.docTypeRepository.findAll();

    const applicableRequiredTypes = requiredDocTypes.filter(dt => 
      dt.isRequired && (dt.appliesTo?.includes(user.accountType) || dt.appliesTo?.includes('ALL'))
    );

    const allRequiredApproved = applicableRequiredTypes.every(reqDoc =>
      userDocuments.some(userDoc => userDoc.documentTypeId === reqDoc.id && userDoc.status === 'APPROVED')
    );

    if (allRequiredApproved) {
      await this.userRepository.update(userId, { habilitationStatus: 'HABILITADO' });
      const bidderRole = await this.roleRepository.findByNormalizedName('BIDDER');
      if (bidderRole) {
        // This is complex and might need a dedicated method in UserRepository
        // For now, we assume a method to add a role without removing others exists.
        // await this.userRepository.addRoleToUser(userId, bidderRole.id);
      }
    } else if (user.documents.length > 0 && user.habilitationStatus === 'PENDING_DOCUMENTS') {
      await this.userRepository.update(userId, { habilitationStatus: 'PENDING_ANALYSIS' });
    }
  }
}
