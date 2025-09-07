// src/services/direct-sale-offer.service.ts
import { DirectSaleOfferRepository } from '@/repositories/direct-sale-offer.repository';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class DirectSaleOfferService {
  private repository: DirectSaleOfferRepository;

  constructor() {
    this.repository = new DirectSaleOfferRepository();
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return this.repository.findAll();
  }

  async getDirectSaleOfferById(id: string): Promise<DirectSaleOffer | null> {
    return this.repository.findById(id);
  }

  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
    try {
      const { categoryId, sellerId, ...offerData } = data;

      const dataToCreate: Prisma.DirectSaleOfferCreateInput = {
        ...(offerData as any),
        publicId: `VD-${uuidv4().substring(0, 8)}`,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        seller: { connect: { id: sellerId } },
      };

      const newOffer = await this.repository.create(dataToCreate);
      return { success: true, message: 'Oferta criada com sucesso.', offerId: newOffer.id };
    } catch (error: any) {
      console.error("Error in DirectSaleOfferService.create:", error);
      return { success: false, message: `Falha ao criar oferta: ${error.message}` };
    }
  }

  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { categoryId, sellerId, ...offerData } = data;
      const dataToUpdate: Prisma.DirectSaleOfferUpdateInput = { ...offerData };

      if (categoryId) {
        dataToUpdate.category = { connect: { id: categoryId } };
      }
      if (sellerId) {
        dataToUpdate.seller = { connect: { id: sellerId } };
      }

      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Oferta atualizada com sucesso.' };
    } catch (error: any) {
      console.error(`Error in DirectSaleOfferService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar oferta: ${error.message}` };
    }
  }

  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Oferta excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in DirectSaleOfferService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir oferta: ${error.message}` };
    }
  }
}
