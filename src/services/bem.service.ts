// src/services/bem.service.ts
import { BemRepository } from '@/repositories/bem.repository';
import type { Bem, BemFormData } from '@/types';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class BemService {
  private repository: BemRepository;

  constructor() {
    this.repository = new BemRepository();
  }

  async getBens(filter?: { judicialProcessId?: string; sellerId?: string }): Promise<Bem[]> {
    return this.repository.findAll(filter);
  }

  async getBemById(id: string): Promise<Bem | null> {
    return this.repository.findById(id);
  }

  async getBensByIds(ids: string[]): Promise<Bem[]> {
    return this.repository.findByIds(ids);
  }

  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    try {
      const dataToCreate: Prisma.BemCreateInput = {
        ...data,
        publicId: `BEM-${uuidv4()}`,
      };
      const newBem = await this.repository.create(dataToCreate);
      return { success: true, message: 'Bem criado com sucesso.', bemId: newBem.id };
    } catch (error: any) {
      console.error("Error in BemService.createBem:", error);
      return { success: false, message: `Falha ao criar bem: ${error.message}` };
    }
  }

  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.update(id, data);
      return { success: true, message: 'Bem atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in BemService.updateBem for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar bem: ${error.message}` };
    }
  }

  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // Note: A real app would check if the 'Bem' is part of an active lot.
      await this.repository.delete(id);
      return { success: true, message: 'Bem excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in BemService.deleteBem for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir bem: ${error.message}` };
    }
  }
}
