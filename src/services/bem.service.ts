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

  private mapBensWithDetails(bens: any[]): Bem[] {
    return bens.map(bem => ({
      ...bem,
      categoryName: bem.category?.name,
      subcategoryName: bem.subcategory?.name,
      judicialProcessNumber: bem.judicialProcess?.processNumber,
      sellerName: bem.seller?.name,
    }));
  }

  async getBens(filter?: { judicialProcessId?: string; sellerId?: string }): Promise<Bem[]> {
    const bens = await this.repository.findAll(filter);
    return this.mapBensWithDetails(bens);
  }

  async getBemById(id: string): Promise<Bem | null> {
    const bem = await this.repository.findById(id);
    if (!bem) return null;
    return this.mapBensWithDetails([bem])[0];
  }

  async getBensByIds(ids: string[]): Promise<Bem[]> {
    const bens = await this.repository.findByIds(ids);
    return this.mapBensWithDetails(bens);
  }

  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    try {
      const dataToCreate: Prisma.BemCreateInput = {
        ...data,
        publicId: `BEM-${uuidv4()}`,
      };
      if (data.categoryId) dataToCreate.category = { connect: { id: data.categoryId } };
      if (data.subcategoryId) dataToCreate.subcategory = { connect: { id: data.subcategoryId } };
      if (data.judicialProcessId) dataToCreate.judicialProcess = { connect: { id: data.judicialProcessId } };
      if (data.sellerId) dataToCreate.seller = { connect: { id: data.sellerId } };
      
      const newBem = await this.repository.create(dataToCreate);
      return { success: true, message: 'Bem criado com sucesso.', bemId: newBem.id };
    } catch (error: any) {
      console.error("Error in BemService.createBem:", error);
      return { success: false, message: `Falha ao criar bem: ${error.message}` };
    }
  }

  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const dataToUpdate: Prisma.BemUpdateInput = { ...data };
      if (data.categoryId) dataToUpdate.category = { connect: { id: data.categoryId } };
      if (data.subcategoryId) dataToUpdate.subcategory = { connect: { id: data.subcategoryId } };
      if (data.judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: data.judicialProcessId } };
      if (data.sellerId) dataToUpdate.seller = { connect: { id: data.sellerId } };

      await this.repository.update(id, dataToUpdate);
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
