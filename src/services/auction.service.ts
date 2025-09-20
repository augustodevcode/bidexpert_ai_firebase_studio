// src/services/auction.service.ts
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Auction, AuctionFormData, LotCategory } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { utcToZonedTime } from 'date-fns-tz';
import { getPrismaInstance } from '@/lib/prisma'; // Import the instance getter

export class AuctionService {
  private auctionRepository: AuctionRepository;
  private prisma;

  constructor() {
    this.auctionRepository = new AuctionRepository();
    this.prisma = getPrismaInstance();
  }

  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      initialOffer: a.initialOffer ? Number(a.initialOffer) : undefined,
      estimatedRevenue: a.estimatedRevenue ? Number(a.estimatedRevenue) : undefined,
      achievedRevenue: a.achievedRevenue ? Number(a.achievedRevenue) : undefined,
      decrementAmount: a.decrementAmount ? Number(a.decrementAmount) : undefined,
      floorPrice: a.floorPrice ? Number(a.floorPrice) : undefined,
      latitude: a.latitude ? Number(a.latitude) : null,
      longitude: a.longitude ? Number(a.longitude) : null,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller ? { ...a.seller } : null,
      auctioneer: a.auctioneer ? { ...a.auctioneer } : null,
      category: a.category ? { ...a.category } : null,
      sellerName: a.seller?.name,
      auctioneerName: a.auctioneer?.name,
      categoryName: a.category?.name,
      stages: a.stages || [],
      lots: (a.lots || []).map((lot: any) => ({
        ...lot,
        price: Number(lot.price),
        initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
        secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
        bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
        evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      }))
    }));
  }

  async getAuctions(tenantId: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findAll(tenantId);
    return this.mapAuctionsWithDetails(auctions);
  }

  async getAuctionById(tenantId: string | undefined, id: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(tenantId, id);
    if (!auction) return null;
    return this.mapAuctionsWithDetails([auction])[0];
  }

  async getAuctionsByIds(tenantId: string, ids: string[]): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByIds(tenantId, ids);
    return this.mapAuctionsWithDetails(auctions);
  }

  async getAuctionsByAuctioneerSlug(tenantId: string, auctioneerSlug: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(tenantId, auctioneerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }

   async getAuctionsBySellerSlug(tenantId: string, sellerSlugOrPublicId: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findBySellerSlug(tenantId, sellerSlugOrPublicId);
    return this.mapAuctionsWithDetails(auctions);
  }

  async createAuction(tenantId: string, data: Partial<AuctionFormData & { auctionStages?: any[], onlineUrl?: string }>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    try {
      if (!data.title) throw new Error("O título do leilão é obrigatório.");
      if (!data.auctioneerId) throw new Error("O ID do leiloeiro é obrigatório.");
      if (!data.sellerId) throw new Error("O ID do comitente é obrigatório.");

      const derivedAuctionDate = (data.auctionStages && data.auctionStages.length > 0 && data.auctionStages[0].startDate)
        ? new Date(data.auctionStages[0].startDate as Date)
        : utcToZonedTime(new Date(), 'America/Sao_Paulo');

      const newAuction = await this.prisma.$transaction(async (tx: any) => {
        const createdAuction = await tx.auction.create({
          data: {
            ...(data as any),
            publicId: `AUC-${uuidv4()}`,
            slug: slugify(data.title!),
            auctionDate: derivedAuctionDate,
            softCloseMinutes: Number(data.softCloseMinutes) || undefined,
            auctioneer: { connect: { id: data.auctioneerId } },
            seller: { connect: { id: data.sellerId } },
            category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
            tenant: { connect: { id: tenantId } },
            city: data.cityId ? { connect: { id: data.cityId } } : undefined,
            state: data.stateId ? { connect: { id: data.stateId } } : undefined,
            judicialProcess: data.judicialProcessId ? { connect: { id: data.judicialProcessId } } : undefined,
          }
        });

        if (data.auctionStages && data.auctionStages.length > 0) {
          await tx.auctionStage.createMany({
            data: data.auctionStages.map((stage: any) => ({
              name: stage.name,
              startDate: new Date(stage.startDate as Date),
              endDate: new Date(stage.endDate as Date),
              initialPrice: stage.initialPrice,
              auctionId: createdAuction.id,
            })),
          });
        }

        return createdAuction;
      });

      return { success: true, message: 'Leilão criado com sucesso.', auctionId: newAuction.id };

    } catch (error: any) {
      console.error("Error in AuctionService.createAuction:", error);
      if (error instanceof PrismaClientValidationError) {
         return { success: false, message: `Falha de validação ao criar leilão: ${error.message}` };
      }
      return { success: false, message: `Falha ao criar leilão: ${error.message}` };
    }
  }

  async updateAuction(tenantId: string, id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const auctionToUpdate = await this.auctionRepository.findById(tenantId, id);
      if (!auctionToUpdate) {
        return { success: false, message: 'Leilão não encontrado para este tenant.' };
      }
      const internalId = auctionToUpdate.id;

      const { categoryId, auctioneerId, sellerId, auctionStages, judicialProcessId, auctioneerName, sellerName, cityId, stateId, ...restOfData } = data;

      await this.prisma.$transaction(async (tx: any) => {
        const dataToUpdate: Prisma.AuctionUpdateInput = {
            ...(restOfData as any),
        };
        
        if (data.title) dataToUpdate.slug = slugify(data.title);
        
        if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
        if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
        if (categoryId) dataToUpdate.category = { connect: { id: categoryId } };
        if (cityId) dataToUpdate.city = { connect: {id: cityId }};
        if (stateId) dataToUpdate.state = { connect: {id: stateId }};
        if (judicialProcessId) {
          dataToUpdate.judicialProcess = { connect: { id: judicialProcessId } };
        } else if (data.hasOwnProperty('judicialProcessId')) {
          dataToUpdate.judicialProcess = { disconnect: true };
        }
        
        if (data.softCloseMinutes) dataToUpdate.softCloseMinutes = Number(data.softCloseMinutes);

        const derivedAuctionDate = (auctionStages && auctionStages.length > 0 && auctionStages[0].startDate) ? auctionStages[0].startDate : (data.auctionDate || undefined);
        if (derivedAuctionDate) {
            dataToUpdate.auctionDate = derivedAuctionDate;
        }

        await tx.auction.update({ where: { id: internalId }, data: dataToUpdate });

        if (auctionStages) {
            await tx.auctionStage.deleteMany({ where: { auctionId: internalId } });
            await tx.auctionStage.createMany({
                data: auctionStages.map(stage => ({
                    name: stage.name,
                    startDate: new Date(stage.startDate as Date),
                    endDate: new Date(stage.endDate as Date),
                    initialPrice: stage.initialPrice,
                    auctionId: internalId,
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

  async deleteAuction(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lotCount = await this.auctionRepository.countLots(tenantId, id);
      if (lotCount > 0) {
        return { success: false, message: `Não é possível excluir. O leilão possui ${lotCount} lote(s) associado(s).` };
      }
      await this.prisma.$transaction(async (tx: any) => {
          await tx.auctionStage.deleteMany({ where: { auctionId: id }});
          await tx.auction.delete({ where: { id, tenantId } });
      });
      return { success: true, message: 'Leilão excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in AuctionService.deleteAuction for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir leilão: ${error.message}` };
    }
  }
}
