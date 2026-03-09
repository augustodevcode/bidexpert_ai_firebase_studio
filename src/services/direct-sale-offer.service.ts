// src/services/direct-sale-offer.service.ts
import { prisma } from '../lib/prisma';
import type { Prisma, DirectSaleOffer as PrismaDirectSaleOffer } from '@prisma/client';
import { DirectSaleOfferRepository } from '@/repositories/direct-sale-offer.repository';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';

const mapOffer = (offer: any): DirectSaleOffer => {
    let gallery: string[] = [];
    if (offer.galleryImageUrls) {
        gallery = typeof offer.galleryImageUrls === 'string'
            ? JSON.parse(offer.galleryImageUrls)
            : Array.isArray(offer.galleryImageUrls) ? offer.galleryImageUrls : [];
    }
    return {
        ...offer,
        id: offer.id.toString(),
        tenantId: offer.tenantId.toString(),
        sellerId: offer.sellerId.toString(),
        categoryId: offer.categoryId.toString(),
        price: offer.price ? Number(offer.price) : null,
        minimumOfferPrice: offer.minimumOfferPrice ? Number(offer.minimumOfferPrice) : null,
        galleryImageUrls: gallery,
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
        const { categoryId, sellerId, imageMediaId, id: _id, ...rest } = data as any;
        // Strip phantom relation fields that might leak from form data
        delete rest.Seller; delete rest.LotCategory; delete rest.Tenant;
        delete rest.seller; delete rest.category; delete rest.tenant;
        delete rest._count;
        const publicId = `DSO-${uuidv4()}`;
        const dataToCreate: Prisma.DirectSaleOfferCreateInput = {
            ...rest,
            publicId,
            imageMediaId: imageMediaId ? BigInt(imageMediaId) : null,
            LotCategory: { connect: { id: BigInt(categoryId) } },
            Seller: { connect: { id: BigInt(sellerId) } },
            Tenant: { connect: { id: BigInt(tenantId) } },
        };
        const newOffer = await this.repository.create(dataToCreate);
        return { success: true, message: 'Oferta criada com sucesso.', offerId: newOffer.id.toString() };
      } catch (error: any) {
          console.error('[direct-sale-service] Create failed:', error);
          return { success: false, message: `Falha ao criar oferta: ${error.message}` };
      }
  }

  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
      try {
          const { categoryId, sellerId, imageMediaId, id: _id, ...rest } = data as any;
          // Strip phantom relation fields
          delete rest.Seller; delete rest.LotCategory; delete rest.Tenant;
          delete rest.seller; delete rest.category; delete rest.tenant;
          delete rest._count; delete rest.publicId; delete rest.tenantId;
          const dataToUpdate: Partial<Prisma.DirectSaleOfferUpdateInput> = {...rest};
          if (imageMediaId !== undefined) {
              dataToUpdate.imageMediaId = imageMediaId ? BigInt(imageMediaId) : null;
          }
          if (categoryId) dataToUpdate.LotCategory = { connect: { id: BigInt(categoryId) } };
          if (sellerId) dataToUpdate.Seller = { connect: { id: BigInt(sellerId) } };
          await this.repository.update(id, dataToUpdate);
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
