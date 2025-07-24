// src/services/seller.service.ts
import { SellerRepository } from '@/repositories/seller.repository';
import type { SellerFormData, SellerProfileInfo, Lot } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
  
  async findByName(name: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findByName(name);
  }

  async getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
      return this.sellerRepository.findBySlug(slugOrId);
  }
  
  async getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
      const seller = await this.sellerRepository.findBySlug(sellerSlugOrId);
      if (!seller) return [];
      return this.sellerRepository.findLotsBySellerId(seller.id);
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
      const existingSeller = await this.sellerRepository.findByName(data.name);
      if (existingSeller) {
        return { success: false, message: 'Já existe um comitente com este nome.' };
      }

      // Prepare the data for creation, generating the required fields.
      const dataToCreate: Prisma.SellerCreateInput = {
        ...data,
        slug: slugify(data.name),
        publicId: `COM-${uuidv4()}`,
      };
      
      const newSeller = await this.sellerRepository.create(dataToCreate);
      return { success: true, message: 'Comitente criado com sucesso.', sellerId: newSeller.id };
    } catch (error: any) {
      console.error("Error in SellerService.createSeller:", error);
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
  
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
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
