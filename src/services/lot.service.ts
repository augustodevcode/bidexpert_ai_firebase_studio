// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
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
      bens: lot.bens
    }));
  }

  async getLotById(id: string): Promise<Lot | null> {
    const lot = await this.repository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      auctionName: lot.auction?.title,
      bens: lot.bens?.map((lb: any) => lb.bem) || [] // Extract bem from LotBens
    };
  }

  async createLot(data: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string; }> {
    try {
      if (!data.auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }

      const lotData = {
        title: data.title || 'Lote sem título',
        number: data.number,
        description: data.description,
        price: data.price,
        initialPrice: data.initialPrice,
        status: data.status,
        auctionId: data.auctionId,
        categoryId: data.categoryId,
        publicId: `LOTE-PUB-${uuidv4()}`,
        slug: slugify(data.title || ''),
      };
      
      const newLot = await this.repository.create(lotData, data.bemIds || []);
      return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id };
    } catch (error: any) {
      console.error("Error in LotService.createLot:", error);
      return { success: false, message: `Falha ao criar lote: ${error.message}` };
    }
  }

  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { bemIds, ...lotData } = data;
      if (lotData.title) {
        lotData.slug = slugify(lotData.title);
      }
      
      await this.repository.update(id, lotData, bemIds);
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
