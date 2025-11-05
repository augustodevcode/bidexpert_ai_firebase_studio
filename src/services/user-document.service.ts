import { UserDocumentRepository } from '@/repositories/user-document.repository';
import type { Prisma } from '@prisma/client';

export class UserDocumentService {
  private repository: UserDocumentRepository;

  constructor() {
    this.repository = new UserDocumentRepository();
  }

  async createUserDocument(data: Prisma.UserDocumentCreateInput) {
    try {
      const newDocument = await this.repository.create(data);
      return { success: true, message: 'Documento de usuário criado com sucesso.', document: newDocument };
    } catch (error: any) {
      console.error('Error creating user document:', error);
      return { success: false, message: `Falha ao criar documento de usuário: ${error.message}` };
    }
  }

  async getUserDocumentById(id: bigint) {
    return this.repository.findById(id);
  }

  async getUserDocuments(args?: Prisma.UserDocumentFindManyArgs) {
    return this.repository.findMany(args);
  }

  async updateUserDocument(id: bigint, data: Prisma.UserDocumentUpdateInput) {
    try {
      const updatedDocument = await this.repository.update(id, data);
      return { success: true, message: 'Documento de usuário atualizado com sucesso.', document: updatedDocument };
    } catch (error: any) {
      console.error('Error updating user document:', error);
      return { success: false, message: `Falha ao atualizar documento de usuário: ${error.message}` };
    }
  }

  async deleteUserDocument(id: bigint) {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Documento de usuário excluído com sucesso.' };
    } catch (error: any) {
      console.error('Error deleting user document:', error);
      return { success: false, message: `Falha ao excluir documento de usuário: ${error.message}` };
    }
  }
}