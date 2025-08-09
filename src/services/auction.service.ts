// src/services/auction.service.ts
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Auction, AuctionFormData, LotCategory } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma'; // Import prisma directly for transactions

export class AuctionService {
  private auctionRepository: AuctionRepository;

  constructor() {
    this.auctionRepository = new AuctionRepository();
  }

  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller, // Pass the full seller object
      auctioneer: a.auctioneer, // Pass the full auctioneer object
      category: a.category, // Pass the full category object
      sellerName: a.seller?.name, 
      auctioneerName: a.auctioneer?.name,
      categoryName: a.category?.name,
      auctionStages: a.auctionStages || [], // Ensure auctionStages is always an array
    }));
  }

  async getAuctions(): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findAll();
    return this.mapAuctionsWithDetails(auctions);
  }

  async getAuctionById(id: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(id);
    if (!auction) return null;
    return this.mapAuctionsWithDetails([auction])[0];
  }
  
  async getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(auctioneerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }

  async createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    try {
      const { categoryId, auctioneerId, sellerId, auctionStages, ...restOfData } = data;

      if (!data.title) throw new Error("O título do leilão é obrigatório.");
      if (!auctioneerId) throw new Error("O ID do leiloeiro é obrigatório.");
      if (!sellerId) throw new Error("O ID do comitente é obrigatório.");
      
      const derivedAuctionDate = (auctionStages && auctionStages.length > 0 && auctionStages[0].startDate) ? auctionStages[0].startDate : new Date();

      const auctionData: Prisma.AuctionCreateInput = {
        ...(restOfData as any),
        auctionDate: derivedAuctionDate,
        publicId: `AUC-${uuidv4()}`,
        slug: slugify(data.title!),
        auctioneer: { connect: { id: auctioneerId } },
        seller: { connect: { id: sellerId } },
      };

      if (categoryId) {
        auctionData.category = { connect: { id: categoryId } };
      }
      
      if (auctionStages && auctionStages.length > 0) {
        auctionData.auctionStages = {
            create: auctionStages.map(stage => ({
                name: stage.name,
                startDate: stage.startDate,
                endDate: stage.endDate,
                initialPrice: stage.initialPrice,
            })),
        };
      }
          
      const newAuction = await this.auctionRepository.create(auctionData);
      
      return { success: true, message: 'Leilão criado com sucesso.', auctionId: newAuction.id };
      
    } catch (error: any) {
      console.error("Error in AuctionService.createAuction:", error);
      return { success: false, message: `Falha ao criar leilão: ${error.message}` };
    }
  }

  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      // Removendo o campo problemático antes de passar para o Prisma
      const { categoryId, auctioneerId, sellerId, auctionStages, mapAddress, ...restOfData } = data;
      
      await prisma.$transaction(async (tx) => {
        const dataToUpdate: Prisma.AuctionUpdateInput = { ...(restOfData as any) };
        if (data.title) dataToUpdate.slug = slugify(data.title);
        if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
        if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
        if (categoryId) dataToUpdate.category = { connect: { id: categoryId } };
        
        const derivedAuctionDate = (auctionStages && auctionStages.length > 0 && auctionStages[0].startDate) ? auctionStages[0].startDate : (data.auctionDate || undefined);
        if (derivedAuctionDate) {
            dataToUpdate.auctionDate = derivedAuctionDate;
        }

        await tx.auction.update({ where: { id }, data: dataToUpdate });

        if (auctionStages) {
            await tx.auctionStage.deleteMany({ where: { auctionId: id } });
            await tx.auctionStage.createMany({
                data: auctionStages.map(stage => ({
                    name: stage.name,
                    startDate: stage.startDate,
                    endDate: stage.endDate,
                    initialPrice: stage.initialPrice,
                    auctionId: id,
                })),
            });
        }
      });

      return { success: true, message: 'Leilão atualizado com sucesso.' };
      
    } catch (error: any) {
      console.error(`Error in AuctionService.updateAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar leilão: ${error.message}` };
    }
  }

  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lotCount = await this.auctionRepository.countLots(id);
      if (lotCount > 0) {
        return { success: false, message: `Não é possível excluir. O leilão possui ${lotCount} lote(s) associado(s).` };
      }
      // Transaction to delete stages and then auction
      await prisma.$transaction(async (tx) => {
          await tx.auctionStage.deleteMany({ where: { auctionId: id }});
          await tx.auction.delete({ where: { id } });
      });
      return { success: true, message: 'Leilão excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctionService.deleteAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leilão: ${error.message}` };
    }
  }
}
