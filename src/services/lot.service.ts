// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma'; // Import prisma for the auction name fallback

export class LotService {
  private repository: LotRepository;

  constructor() {
    this.repository = new LotRepository();
  }

  async getLots(auctionId?: string): Promise<Lot[]> {
    const lots = await this.repository.findAll(auctionId);
    return lots.map(lot => ({
      ...lot,
      auctionName: lot.auction?.title,
      bens: lot.bens
    }));
  }

  async getLotById(id: string): Promise<Lot | null> {
    const lot = await this.repository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      auctionName: lot.auction?.title,
      bens: lot.bens
    };
  }

  async createLot(data: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string; }> {
    try {
      const { bemIds, ...lotData } = data;
      const dataToCreate: Prisma.LotCreateInput = {
        ...lotData,
        publicId: `LOTE-PUB-${uuidv4()}`,
        slug: slugify(data.title || ''),
        bens: bemIds ? { connect: bemIds.map(id => ({ id })) } : undefined,
      };

      if (data.auctionId) {
        dataToCreate.auction = { connect: { id: data.auctionId } };
      }

      if (data.categoryId) {
        dataToCreate.category = { connect: { id: data.categoryId } };
      }

      const newLot = await this.repository.create(dataToCreate);
      return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id };
    } catch (error: any) {
      console.error("Error in LotService.createLot:", error);
      return { success: false, message: `Falha ao criar lote: ${error.message}` };
    }
  }

  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { bemIds, ...lotData } = data;
      const dataToUpdate: Prisma.LotUpdateInput = { ...lotData };

      if (data.title) {
        dataToUpdate.slug = slugify(data.title);
      }
      
      if (bemIds !== undefined) {
          dataToUpdate.bens = { set: bemIds.map(id => ({ id })) };
      }

      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Lote excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.deleteLot for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir lote: ${error.message}` };
    }
  }
}
