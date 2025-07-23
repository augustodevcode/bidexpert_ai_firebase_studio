// src/services/seller.service.ts
import { SellerRepository } from '@/repositories/seller.repository';
import type { SellerFormData, SellerProfileInfo, Lot } from '@/types';

export class SellerService {
  private sellerRepository: SellerRepository;

  constructor() {
    this.sellerRepository = new SellerRepository();
  }

  async getSellers(): Promise<SellerProfileInfo[]> {
    return this.sellerRepository.findAll();
  }

  async getSellerById(id: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findById(id);
  }

  async getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findBySlug(slugOrId);
  }
  
  async getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
      const seller = await this.sellerRepository.findBySlug(sellerSlugOrId);
      if (!seller) return [];
      return this.sellerRepository.findLotsBySellerId(seller.id);
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string }> {
    // Business logic before creation can go here (e.g., validation)
    try {
      const newSeller = await this.sellerRepository.create(data);
      return { success: true, message: 'Comitente criado com sucesso.', sellerId: newSeller.id };
    } catch (error: any) {
      console.error("Error in SellerService.createSeller:", error);
      return { success: false, message: `Falha ao criar comitente: ${error.message}` };
    }
  }

  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }> {
     // Business logic before update can go here
    try {
      await this.sellerRepository.update(id, data);
      return { success: true, message: 'Comitente atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  
  async deleteSeller(id: string): Promise<{ success: boolean; message: string }> {
    // Business logic before deletion can go here
    // For example, check if the seller has active auctions.
    // const activeAuctions = await someOtherRepository.findActiveAuctionsBySeller(id);
    // if (activeAuctions.length > 0) {
    //   return { success: false, message: 'Não é possível excluir comitente com leilões ativos.' };
    // }
    try {
      await this.sellerRepository.delete(id);
      return { success: true, message: 'Comitente excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in SellerService.deleteSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
  }
}
