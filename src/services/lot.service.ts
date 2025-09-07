// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class LotService {
  private repository: LotRepository;

  constructor() {
    this.repository = new LotRepository();
  }

  async getLots(auctionId?: string): Promise<Lot[]> {
    const lots = await this.repository.findAll(auctionId);
    // O repositório agora retorna a estrutura correta com o `bens` populado
    return lots.map(lot => ({
      ...lot,
      bens: lot.bens.map((lb: any) => lb.bem), // Extrai o objeto 'bem'
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
    }));
  }

  async getLotById(id: string): Promise<Lot | null> {
    const lot = await this.repository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      bens: lot.bens.map((lb: any) => lb.bem), // Extrai o objeto 'bem'
      auction: lot.auction, // Pass the full auction object
    };
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    const lots = await this.repository.findByIds(ids);
    // Não precisa mapear aqui pois o repositório já inclui o leilão
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
        stageDetails, // Captura os detalhes das etapas
        ...lotData 
      } = data;
      const finalCategoryId = categoryId || type;

      if (!auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }
      if (!finalCategoryId) {
          return { success: false, message: "A categoria é obrigatória para o lote."}
      }

      // Prepara os dados para o Prisma, convertendo os campos numéricos e removendo os que não pertencem ao modelo Lot.
      const dataToCreate: Prisma.LotCreateInput = {
        ...(lotData as any),
        price: Number(lotData.price) || Number(lotData.initialPrice) || 0,
        publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(lotData.title || ''),
        auction: { connect: { id: auctionId } },
        category: { connect: { id: finalCategoryId } },
        isRelisted: data.isRelisted || false,
        relistCount: data.relistCount || 0,
      };

      if (data.originalLotId) {
        dataToCreate.originalLot = { connect: { id: data.originalLotId } };
      }
      if (sellerId) {
        dataToCreate.seller = { connect: { id: sellerId } };
      }
      if (data.auctioneerId) {
        dataToCreate.auctioneer = { connect: { id: data.auctioneerId } };
      }
      if (subcategoryId) {
        dataToCreate.subcategory = { connect: { id: subcategoryId } };
      }
      if (data.hasOwnProperty('inheritedMediaFromBemId')) {
        dataToUpdate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
      }
      
      const newLot = await this.repository.create(dataToCreate, bemIds || []);
      
      // Update the status of the linked 'bens' to 'LOTEADO'
      if (bemIds && bemIds.length > 0) {
        await prisma.bem.updateMany({
            where: { id: { in: bemIds } },
            data: { status: 'LOTEADO' },
        });
      }
      
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
        stageDetails, // Capturando os detalhes das etapas
        ...lotData 
      } = data;

      const dataToUpdate: Prisma.LotUpdateInput = { 
          ...(lotData as any),
          price: lotData.price ? Number(lotData.price) : undefined,
      };

      if (lotData.title) {
        dataToUpdate.slug = slugify(lotData.title);
      }
      const finalCategoryId = categoryId || type;
      if (finalCategoryId) {
        dataToUpdate.category = { connect: { id: finalCategoryId } };
      }
      if (auctionId) {
        dataToUpdate.auction = { connect: { id: auctionId } };
      }
      if (subcategoryId) {
        dataToUpdate.subcategory = { connect: { id: subcategoryId } };
      } else if (data.hasOwnProperty('subcategoryId')) {
        dataToUpdate.subcategory = { disconnect: true };
      }
      if (sellerId) {
        dataToUpdate.seller = { connect: { id: sellerId } };
      }
      if (auctioneerId) {
        dataToUpdate.auctioneer = { connect: { id: auctioneerId } };
      }
      if (cityId) {
        dataToUpdate.city = { connect: { id: cityId } };
      }
      if (stateId) {
        dataToUpdate.state = { connect: { id: stateId } };
      }
      if (data.hasOwnProperty('inheritedMediaFromBemId')) {
        dataToUpdate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
      }
      
      // A atualização dos bens vinculados e a atualização dos detalhes das etapas são agora transacionais
      await this.repository.update(id, dataToUpdate, bemIds, stageDetails);

      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // Find the lot to get associated bemIds before deleting
      const lotToDelete = await prisma.lot.findUnique({
        where: { id },
        include: { bens: { select: { bemId: true } } },
      });

      if (lotToDelete) {
        const bemIdsToRelease = lotToDelete.bens.map(b => b.bemId);

        // The repository handles the transactional deletion of Lot and LotBens.
        await this.repository.delete(id);
        
        // After successful deletion, update the status of the previously linked bens
        if (bemIdsToRelease.length > 0) {
          await prisma.bem.updateMany({
            where: { id: { in: bemIdsToRelease } },
            data: { status: 'DISPONIVEL' },
          });
        }
      } else {
         return { success: false, message: 'Lote não encontrado para exclusão.' };
      }

      return { success: true, message: 'Lote excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.deleteLot for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir lote: ${error.message}` };
    }
  }
  
  async finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
      const lot = await this.getLotById(lotId);
      if (!lot) return { success: false, message: "Lote não encontrado." };
      if (lot.status !== 'ABERTO_PARA_LANCES' && lot.status !== 'ENCERRADO') {
          return { success: false, message: `O lote não pode ser finalizado no status atual (${lot.status}).`};
      }

      const winningBid = await prisma.bid.findFirst({
          where: { lotId: lot.id },
          orderBy: { amount: 'desc' },
      });

      if (winningBid) {
          await prisma.lot.update({
              where: { id: lot.id },
              data: { status: 'VENDIDO', winnerId: winningBid.bidderId, price: winningBid.amount },
          });
           await prisma.userWin.create({
              data: {
                  lotId: lot.id,
                  userId: winningBid.bidderId,
                  winningBidAmount: winningBid.amount,
                  winDate: new Date(),
                  paymentStatus: 'PENDENTE'
              }
          });
          // After sale, update the associated 'bem' status to 'VENDIDO'
           if (lot.bemIds && lot.bemIds.length > 0) {
                await prisma.bem.updateMany({
                    where: { id: { in: lot.bemIds } },
                    data: { status: 'VENDIDO' },
                });
            }
          return { success: true, message: `Lote finalizado! Vencedor: ${winningBid.bidderDisplay} com R$ ${winningBid.amount.toLocaleString('pt-BR')}.`};
      } else {
           await prisma.lot.update({
              where: { id: lot.id },
              data: { status: 'NAO_VENDIDO' },
          });
          // If not sold, release the 'bens' back to 'DISPONIVEL'
           if (lot.bemIds && lot.bemIds.length > 0) {
                await prisma.bem.updateMany({
                    where: { id: { in: lot.bemIds } },
                    data: { status: 'DISPONIVEL' },
                });
            }
           return { success: true, message: "Lote finalizado como 'Não Vendido' por falta de lances." };
      }
  }

  async generateWinningBidTerm(lotId: string): Promise<{ success: boolean; message: string; pdfBase64?: string; fileName?: string; }> {
    const lot = await this.getLotById(lotId);
    if (!lot || !lot.winnerId || !lot.auction) {
      return { success: false, message: 'Dados insuficientes para gerar o termo. Verifique se o lote foi finalizado e possui um vencedor.' };
    }
    
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
        await this.updateLot(lotId, { winningBidTermUrl: `/${result.fileName}` }); // Placeholder URL
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
