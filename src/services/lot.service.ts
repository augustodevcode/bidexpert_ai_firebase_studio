// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import { BidRepository } from '@/repositories/bid.repository'; // Import BidRepository
import type { Lot, LotFormData } from '@/types';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class LotService {
  private lotRepository: LotRepository;
  private bidRepository: BidRepository; // Add bidRepository instance

  constructor() {
    this.lotRepository = new LotRepository();
    this.bidRepository = new BidRepository(); // Initialize bidRepository
  }

  async getLots(auctionId?: string): Promise<Lot[]> {
    const lots = await this.lotRepository.findAll(auctionId);
    return lots.map(lot => ({
      ...lot,
      bens: lot.bens.map((lb: any) => lb.bem),
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
    }));
  }

  async getLotById(id: string): Promise<Lot | null> {
    const lot = await this.lotRepository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      bens: lot.bens.map((lb: any) => lb.bem),
      auction: lot.auction,
    };
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    const lots = await this.lotRepository.findByIds(ids);
    return lots as Lot[];
  }


  async createLot(data: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string; }> {
    try {
      const { 
        bemIds, 
        categoryId, 
        auctionId, 
        type, 
        sellerId, 
        subcategoryId,
        stageDetails,
        ...lotData 
      } = data;
      const finalCategoryId = categoryId || type;

      if (!auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }
      if (!finalCategoryId) {
          return { success: false, message: "A categoria é obrigatória para o lote."}
      }

      const dataToCreate: Prisma.LotCreateInput = {
        ...(lotData as any),
        price: Number(lotData.price) || Number(lotData.initialPrice) || 0,
        publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`,
        slug: lotData.title ? lotData.title : '',
        auction: { connect: { id: auctionId } },
        category: { connect: { id: finalCategoryId } },
        isRelisted: data.isRelisted || false,
        relistCount: data.relistCount || 0,
      };

      if (data.originalLotId) dataToCreate.originalLot = { connect: { id: data.originalLotId } };
      if (sellerId) dataToCreate.seller = { connect: { id: sellerId } };
      if (data.auctioneerId) dataToCreate.auctioneer = { connect: { id: data.auctioneerId } };
      if (subcategoryId) dataToCreate.subcategory = { connect: { id: subcategoryId } };
      if (data.hasOwnProperty('inheritedMediaFromBemId')) dataToCreate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
      
      const newLot = await this.lotRepository.create(dataToCreate, bemIds || []);
      
      return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id };
    } catch (error: any) {
      console.error("Error in LotService.createLot:", error);
      return { success: false, message: `Falha ao criar lote: ${error.message}` };
    }
  }

  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { 
        bemIds, categoryId, subcategoryId, type, auctionId, 
        sellerId, auctioneerId, stateId, cityId,
        stageDetails,
        ...lotData 
      } = data;

      const dataToUpdate: Prisma.LotUpdateInput = { 
          ...(lotData as any),
          price: lotData.price ? Number(lotData.price) : undefined,
      };

      if (lotData.title) dataToUpdate.slug = lotData.title;
      const finalCategoryId = categoryId || type;
      if (finalCategoryId) dataToUpdate.category = { connect: { id: finalCategoryId } };
      if (auctionId) dataToUpdate.auction = { connect: { id: auctionId } };
      if (subcategoryId) dataToUpdate.subcategory = { connect: { id: subcategoryId } };
      else if (data.hasOwnProperty('subcategoryId')) dataToUpdate.subcategory = { disconnect: true };
      if (sellerId) dataToUpdate.seller = { connect: { id: sellerId } };
      if (auctioneerId) dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
      if (cityId) dataToUpdate.city = { connect: { id: cityId } };
      if (stateId) dataToUpdate.state = { connect: { id: stateId } };
      if (data.hasOwnProperty('inheritedMediaFromBemId')) dataToUpdate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
      
      await this.lotRepository.update(id, dataToUpdate, bemIds, stageDetails);

      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    return this.lotRepository.delete(id);
  }
  
  async finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
      const lot = await this.getLotById(lotId);
      if (!lot) return { success: false, message: "Lote não encontrado." };
      if (lot.status !== 'ABERTO_PARA_LANCES' && lot.status !== 'ENCERRADO') {
          return { success: false, message: `O lote não pode ser finalizado no status atual (${lot.status}).`};
      }

      const winningBid = await this.bidRepository.findHighestBid(lot.id);

      if (winningBid) {
          await this.lotRepository.update(lot.id, { status: 'VENDIDO', winnerId: winningBid.bidderId, price: winningBid.amount });
           return { success: true, message: `Lote finalizado! Vencedor: ${winningBid.bidderDisplay} com R$ ${winningBid.amount.toLocaleString('pt-BR')}.`};
      } else {
           await this.lotRepository.update(lot.id, { status: 'NAO_VENDIDO' });
           return { success: true, message: "Lote finalizado como 'Não Vendido' por falta de lances." };
      }
  }

  async generateWinningBidTerm(lotId: string): Promise<{ success: boolean; message: string; pdfBase64?: string; fileName?: string; }> {
    const lot = await this.getLotById(lotId);
    if (!lot || !lot.winnerId || !lot.auction) {
      return { success: false, message: 'Dados insuficientes para gerar o termo. Verifique se o lote foi finalizado e possui um vencedor.' };
    }
    
    // This is a direct DB access that should be moved to a repository
    const winner = await prisma.user.findUnique({ where: { id: lot.winnerId } });
    if (!winner) {
      return { success: false, message: 'Arrematante não encontrado.' };
    }

    const { auction } = lot;
    const auctioneer = auction.auctioneer;
    const seller = auction.seller;

    try {
      const result = await generateDocument({
        documentType: 'WINNING_BID_TERM',
        data: {
          lot: lot,
          auction: auction,
          winner: winner,
          auctioneer: auctioneer,
          seller: seller,
          currentDate: format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
        },
      });

      if (result.pdfBase64 && result.fileName) {
        await this.updateLot(lotId, { winningBidTermUrl: `/${result.fileName}` }); 
        return { ...result, success: true, message: 'Documento gerado com sucesso!' };
      } else {
        throw new Error("A geração do PDF não retornou os dados esperados.");
      }
    } catch (error: any) {
      console.error("Error generating winning bid term PDF:", error);
      return { success: false, message: `Falha ao gerar documento: ${error.message}` };
    }
  }
}
