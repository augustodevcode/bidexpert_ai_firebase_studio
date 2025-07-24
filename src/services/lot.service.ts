// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
      bens: lot.bens.map((lb: any) => lb.bem) || [] // Extract bem from LotBens
    }));
  }

  async getLotById(id: string): Promise<Lot | null> {
    const lot = await this.repository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      auctionName: lot.auction?.title,
      bens: lot.bens?.map((lb: any) => lb.bem) || []
    };
  }

  async createLot(data: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string; }> {
    try {
      if (!data.auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }
      if (!data.categoryId) {
          return { success: false, message: "A categoria é obrigatória para o lote."}
      }

      const { bemIds, ...lotData } = data;

      const dataToCreate: Prisma.LotCreateInput = {
        title: lotData.title || 'Lote sem título',
        number: lotData.number,
        description: lotData.description,
        price: lotData.price,
        initialPrice: lotData.initialPrice,
        status: lotData.status,
        publicId: `LOTE-PUB-${uuidv4()}`,
        slug: slugify(lotData.title || ''),
        auction: { connect: { id: data.auctionId } },
        category: { connect: { id: data.categoryId } },
      };
      
      const newLot = await this.repository.create(dataToCreate, bemIds || []);
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
      if (lotData.title) {
        dataToUpdate.slug = slugify(lotData.title);
      }
       if (lotData.categoryId) {
        dataToUpdate.category = { connect: { id: lotData.categoryId } };
      }
       if (lotData.auctionId) {
        dataToUpdate.auction = { connect: { id: lotData.auctionId } };
      }
      
      await this.repository.update(id, dataToUpdate, bemIds);
      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // The repository now handles the transactional deletion of Lot and LotBens.
      await this.repository.delete(id);
      return { success: true, message: 'Lote excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.deleteLot for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir lote: ${error.message}` };
    }
  }
}
