// src/services/direct-sale-offer.service.ts
import { prisma } from '../lib/prisma';
import type { Prisma, DirectSaleOffer as PrismaDirectSaleOffer } from '@prisma/client';
import { DirectSaleOfferRepository } from '@/repositories/direct-sale-offer.repository';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';

const mapOffer = (offer: any): DirectSaleOffer => {
    return {
        ...offer,
        id: offer.id.toString(),
        tenantId: offer.tenantId.toString(),
        sellerId: offer.sellerId.toString(),
        categoryId: offer.categoryId.toString(),
        price: offer.price ? Number(offer.price) : null,
        minimumOfferPrice: offer.minimumOfferPrice ? Number(offer.minimumOfferPrice) : null,
        galleryImageUrls: offer.galleryImageUrls ? JSON.parse(offer.galleryImageUrls as string) : [],
        category: offer.category?.name,
    }
}

export class DirectSaleOfferService {
  private prisma;
  private repository: DirectSaleOfferRepository;

  constructor() {
    this.prisma = prisma;
    this.repository = new DirectSaleOfferRepository();
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    const offers = await this.repository.findAll();
    return offers.map(mapOffer);
  }

  async getDirectSaleOfferById(id: string): Promise<DirectSaleOffer | null> {
    const offer = await this.repository.findById(id);
    return offer ? mapOffer(offer) : null;
  }
  
  async createDirectSaleOffer(tenantId: string, data: DirectSaleOfferFormData): Promise<{ success: boolean, message: string, offerId?: string }> {
      try {
        const { categoryId, sellerId, ...rest } = data;
        const publicId = `DSO-${uuidv4()}`;
        const dataToCreate: Omit<Prisma.DirectSaleOfferCreateInput, 'publicId'> = {
            ...rest,
            LotCategory: { connect: { id: BigInt(categoryId) } },
            Seller: { connect: { id: BigInt(sellerId) } },
            Tenant: { connect: { id: BigInt(tenantId) } },
        };
        const newOffer = await this.repository.create(dataToCreate, publicId);
        return { success: true, message: 'Oferta criada com sucesso.', offerId: newOffer.id.toString() };
      } catch (error: any) {
          return { success: false, message: `Falha ao criar oferta: ${error.message}` };
      }
  }

  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
      try {
          const { categoryId, sellerId, ...rest } = data;
          const dataToUpdate: Partial<Prisma.DirectSaleOfferUpdateInput> = {...rest};
          if (categoryId) dataToUpdate.category = { connect: { id: BigInt(categoryId) } };
          if (sellerId) dataToUpdate.seller = { connect: { id: BigInt(sellerId) } };
          await this.repository.update(BigInt(id), dataToUpdate);
          return { success: true, message: 'Oferta atualizada com sucesso.' };
      } catch(error: any) {
           return { success: false, message: `Falha ao atualizar oferta: ${error.message}` };
      }
  }
  
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
      try {
        await this.repository.delete(BigInt(id));
        return { success: true, message: 'Oferta excluída com sucesso.' };
      } catch(error: any) {
        return { success: false, message: `Falha ao excluir oferta: ${error.message}` };
      }
  }

  async deleteMany(args: Prisma.DirectSaleOfferDeleteManyArgs) {
    return this.repository.deleteMany(args);
  }
}
