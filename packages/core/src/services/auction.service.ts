// packages/core/src/services/auction.service.ts
import { AuctionRepository } from '../repositories/auction.repository';
import type { Auction, AuctionFormData, LotCategory, AuctionDashboardData } from '../types';
import { slugify } from '../lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class AuctionService {
  private auctionRepository: AuctionRepository;

  constructor() {
    this.auctionRepository = new AuctionRepository();
  }

  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller,
      auctioneer: a.auctioneer,
      category: a.category,
      sellerName: a.seller?.name, 
      auctioneerName: a.auctioneer?.name,
      categoryName: a.category?.name,
      auctionStages: a.stages || a.auctionStages || [],
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
  
  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    if (ids.length === 0) return [];
    const auctions = await this.auctionRepository.findByIds(ids);
    return this.mapAuctionsWithDetails(auctions);
  }
  
  async getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findByAuctioneerSlug(auctioneerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }

  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findBySellerSlug(sellerSlug);
    return this.mapAuctionsWithDetails(auctions);
  }

  async createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    try {
      const { categoryId, auctioneerId, sellerId, stages, judicialProcessId, cityId, stateId, ...restOfData } = data;

      if (!data.title) throw new Error("O título do leilão é obrigatório.");
      if (!auctioneerId) throw new Error("O ID do leiloeiro é obrigatório.");
      if (!sellerId) throw new Error("O ID do comitente é obrigatório.");
      
      const derivedAuctionDate = (stages && stages.length > 0 && stages[0].startDate) ? stages[0].startDate : new Date();

      const auctionData: Prisma.AuctionCreateInput = {
        ...(restOfData as any),
        auctionDate: derivedAuctionDate,
        publicId: `AUC-${uuidv4()}`,
        slug: slugify(data.title!),
        auctioneer: { connect: { id: auctioneerId } },
        seller: { connect: { id: sellerId } },
        auctionType: data.auctionType,
        participation: data.participation,
        auctionMethod: data.auctionMethod,
        softCloseMinutes: Number(data.softCloseMinutes),
      };

      if (categoryId) auctionData.category = { connect: { id: categoryId } };
      if (cityId) auctionData.city = { connect: { id: cityId } };
      if (stateId) auctionData.state = { connect: { id: stateId } };
      if (judicialProcessId) auctionData.judicialProcess = { connect: { id: judicialProcessId } };
      
      if (stages && stages.length > 0) {
        auctionData.stages = {
            create: stages.map(stage => ({
                name: stage.name,
                startDate: new Date(stage.startDate as Date),
                endDate: new Date(stage.endDate as Date),
                evaluationValue: stage.evaluationValue,
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
      const auctionToUpdate = await this.auctionRepository.findById(id);
      if (!auctionToUpdate) return { success: false, message: 'Leilão não encontrado para atualização.' };

      const internalId = auctionToUpdate.id;
      const { categoryId, auctioneerId, sellerId, stages, judicialProcessId, cityId, stateId, ...restOfData } = data;
      
      await prisma.$transaction(async (tx) => {
        const dataToUpdate: Prisma.AuctionUpdateInput = { ...(restOfData as any) };
        
        if (data.title) dataToUpdate.slug = slugify(data.title);
        if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
        if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
        if (categoryId) dataToUpdate.category = { connect: { id: categoryId } };
        if (cityId) dataToUpdate.city = { connect: {id: cityId }};
        if (stateId) dataToUpdate.state = { connect: {id: stateId }};
        if (judicialProcessId) dataToUpdate.judicialProcess = { connect: { id: judicialProcessId } };
        else if (data.hasOwnProperty('judicialProcessId')) dataToUpdate.judicialProcess = { disconnect: true };
        
        if (data.softCloseMinutes) dataToUpdate.softCloseMinutes = Number(data.softCloseMinutes);
        const derivedAuctionDate = (stages && stages.length > 0 && stages[0].startDate) ? stages[0].startDate : (data.auctionDate || undefined);
        if (derivedAuctionDate) dataToUpdate.auctionDate = derivedAuctionDate;
        
        await tx.auction.update({ where: { id: internalId }, data: dataToUpdate });

        if (stages) {
            await tx.auctionStage.deleteMany({ where: { auctionId: internalId } });
            await tx.auctionStage.createMany({
                data: stages.map(stage => ({
                    name: stage.name,
                    startDate: new Date(stage.startDate as Date),
                    endDate: new Date(stage.endDate as Date),
                    evaluationValue: stage.evaluationValue,
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

  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lotCount = await this.auctionRepository.countLots(id);
      if (lotCount > 0) {
        return { success: false, message: `Não é possível excluir. O leilão possui ${lotCount} lote(s) associado(s).` };
      }
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
  
  async updateAuctionTitle(id: string, newTitle: string): Promise<{ success: boolean; message: string; }> {
    return this.updateAuction(id, { title: newTitle });
  }

  async updateAuctionImage(auctionId: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean; message: string; }> {
    return this.updateAuction(auctionId, { imageUrl: imageUrl, imageMediaId: mediaItemId });
  }

  async updateAuctionFeaturedStatus(id: string, newStatus: boolean): Promise<{ success: boolean; message: string; }> {
    return this.updateAuction(id, { isFeaturedOnMarketplace: newStatus });
  }

  async getAuctionDashboardData(auctionId: string): Promise<AuctionDashboardData | null> {
    try {
        const auction = await this.getAuctionById(auctionId);
        if (!auction) return null;

        const soldLots = (auction.lots || []).filter(lot => lot.status === 'VENDIDO');
        const totalRevenue = soldLots.reduce((acc, lot) => acc + (lot.price || 0), 0);
        
        const allBids = await prisma.bid.findMany({ where: { auctionId: auction.id }, orderBy: { timestamp: 'asc' } });
        const totalBids = allBids.length;
        const uniqueBidders = new Set(allBids.map(bid => bid.bidderId)).size;
        
        const salesRate = auction.totalLots && auction.totalLots > 0 ? (soldLots.length / auction.totalLots) * 100 : 0;

        // Revenue by Category
        const revenueByCategoryMap = new Map<string, number>();
        soldLots.forEach(lot => {
            const categoryName = lot.categoryName || 'Sem Categoria';
            const currentRevenue = revenueByCategoryMap.get(categoryName) || 0;
            revenueByCategoryMap.set(categoryName, currentRevenue + (lot.price || 0));
        });
        const revenueByCategory = Array.from(revenueByCategoryMap, ([name, Faturamento]) => ({ name, Faturamento }))
            .sort((a,b) => b.Faturamento - a.Faturamento);

        // Bids over Time
        const bidsOverTimeMap = new Map<string, number>();
        allBids.forEach(bid => {
            const dayKey = format(new Date(bid.timestamp as Date), 'dd/MM', { locale: ptBR });
            bidsOverTimeMap.set(dayKey, (bidsOverTimeMap.get(dayKey) || 0) + 1);
        });
        const bidsOverTime = Array.from(bidsOverTimeMap, ([name, Lances]) => ({ name, Lances }))
             .sort((a, b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime());

        return {
            totalRevenue, totalBids, uniqueBidders, salesRate, revenueByCategory, bidsOverTime,
        };
    } catch (error: any) {
        console.error(`[Service - getAuctionDashboardData] Error for auction ${auctionId}:`, error);
        throw new Error("Falha ao buscar dados de performance do leilão.");
    }
  }
}
