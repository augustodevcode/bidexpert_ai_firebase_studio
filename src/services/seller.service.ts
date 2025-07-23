// src/services/seller.service.ts
import { SellerRepository } from '@/repositories/seller.repository';
import type { SellerFormData, SellerProfileInfo, Lot } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

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
    try {
      const dataWithSlug = { ...data, slug: slugify(data.name) };
      const newSeller = await this.sellerRepository.create(dataWithSlug);
      return { success: true, message: 'Comitente criado com sucesso.', sellerId: newSeller.id };
    } catch (error: any) {
      console.error("Error in SellerService.createSeller:", error);
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return { success: false, message: 'Já existe um comitente com este nome.' };
      }
      return { success: false, message: `Falha ao criar comitente: ${error.message}` };
    }
  }

  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.sellerRepository.update(id, dataWithSlug);
      return { success: true, message: 'Comitente atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  
  async deleteSeller(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const lots = await this.sellerRepository.findLotsBySellerId(id);
      if (lots.length > 0) {
        return { success: false, message: `Não é possível excluir. O comitente está vinculado a ${lots.length} lote(s).` };
      }
      await this.sellerRepository.delete(id);
      return { success: true, message: 'Comitente excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in SellerService.deleteSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
  }
}
