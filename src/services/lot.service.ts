
// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData, BidInfo, UserLotMaxBid, Review, LotQuestion } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';

export class LotService {
  private repository: LotRepository;

  constructor() {
    this.repository = new LotRepository();
  }

  private mapLotWithDetails(lot: any): Lot {
    return {
      ...lot,
      price: lot.price ? Number(lot.price) : 0,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      bens: lot.bens?.map((lb: any) => lb.bem) || [],
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
    };
  }

  async getLots(auctionId?: string, tenantId?: string): Promise<Lot[]> {
    const lots = await this.repository.findAll(auctionId, tenantId);
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    const lots = await this.repository.findByIds(ids);
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async getLotById(id: string, tenantId?: string): Promise<Lot | null> {
    const lot = await this.repository.findById(id, tenantId);
    if (!lot) return null;
    return this.mapLotWithDetails(lot);
  }

  async placeBid(lotIdOrPublicId: string, userId: string, bidAmount: number, userDisplayName: string): Promise<{ success: boolean; message: string; updatedLot?: Partial<Lot>; newBid?: BidInfo; }> {
    try {
        const lot = await this.getLotById(lotIdOrPublicId);
        if (!lot) return { success: false, message: 'Lote não encontrado.' };

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.habilitationStatus !== 'HABILITADO') {
            return { success: false, message: "Apenas usuários com status 'HABILITADO' podem dar lances." };
        }
        
        const isHabilitadoForAuction = await prisma.auctionHabilitation.findUnique({
            where: { userId_auctionId: { userId, auctionId: lot.auctionId } }
        });
        if (!isHabilitadoForAuction) {
            return { success: false, message: "Você não está habilitado para dar lances neste leilão. Por favor, habilite-se na página do leilão." };
        }

        if (lot.status !== 'ABERTO_PARA_LANCES') {
            return { success: false, message: 'Este lote não está aberto para lances.' };
        }
        
        const bidIncrement = lot.bidIncrementStep || 1;
        const nextMinimumBid = lot.price + bidIncrement;
        if (bidAmount < nextMinimumBid) {
            return { success: false, message: `O lance deve ser de no mínimo R$ ${nextMinimumBid.toLocaleString('pt-BR')}.` };
        }

        const previousHighBid = await prisma.bid.findFirst({
            where: { lotId: lot.id },
            orderBy: { timestamp: 'desc' }
        });

        const newBid = await prisma.bid.create({
            data: {
                lotId: lot.id,
                auctionId: lot.auctionId,
                bidderId: userId,
                bidderDisplay: userDisplayName,
                amount: bidAmount,
            }
        });

        if (previousHighBid && previousHighBid.bidderId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: previousHighBid.bidderId,
                    message: `Seu lance no lote "${lot.title}" foi superado.`,
                    link: `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`,
                    tenantId: lot.tenantId,
                }
            });
        }
        
        const updatedLot = await this.repository.update(lot.id, { price: bidAmount, bidsCount: { increment: 1 } });
        
        return {
            success: true,
            message: "Lance realizado com sucesso!",
            updatedLot: {
                price: updatedLot.price,
                bidsCount: updatedLot.bidsCount,
            },
            newBid: newBid as BidInfo,
        };

    } catch (error: any) {
        console.error("Error in LotService.placeBid:", error);
        return { success: false, message: `Ocorreu um erro ao registrar seu lance: ${error.message}` };
    }
  }

  async placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean, message: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: 'Lote não encontrado.' };

    await prisma.userLotMaxBid.upsert({
        where: { userId_lotId: { userId, lotId } },
        update: { maxAmount, isActive: true },
        create: { userId, lotId, maxAmount, isActive: true }
    });
    
    return { success: true, message: "Lance máximo definido com sucesso!" };
  }

  async getActiveUserMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot || !userId) return null;

    return prisma.userLotMaxBid.findFirst({
        where: { userId: userId, lotId: lot.id, isActive: true }
    });
  }

  async getBidHistory(lotIdOrPublicId: string): Promise<BidInfo[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    // @ts-ignore
    return prisma.bid.findMany({ where: { lotId: lot.id }, orderBy: { timestamp: 'desc' } });
  }

  async getReviews(lotIdOrPublicId: string): Promise<Review[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    // @ts-ignore
    return prisma.review.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
  }

  async createReview(lotId: string, userId: string, userDisplayName: string, rating: number, comment: string): Promise<{ success: boolean; message: string; reviewId?: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote não encontrado." };

    try {
      const newReview = await prisma.review.create({
          data: { lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, rating, comment }
      });
      return { success: true, message: 'Avaliação enviada com sucesso.', reviewId: newReview.id };
    } catch(error) {
      console.error("Error creating review:", error);
      return { success: false, message: "Falha ao enviar avaliação." };
    }
  }

  async getQuestions(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    // @ts-ignore
    return prisma.lotQuestion.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
  }

  async createQuestion(lotId: string, userId: string, userDisplayName: string, questionText: string): Promise<{ success: boolean; message: string; questionId?: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote não encontrado." };

    try {
      const newQuestion = await prisma.lotQuestion.create({
          data: { lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, questionText, isPublic: true }
      });
      return { success: true, message: 'Pergunta enviada com sucesso.', questionId: newQuestion.id };
    } catch(error) {
      console.error("Error creating question:", error);
      return { success: false, message: "Falha ao enviar pergunta." };
    }
  }
  
  async answerQuestion(questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string }> {
      try {
        await prisma.lotQuestion.update({
            where: { id: questionId },
            data: { answerText, answeredByUserId, answeredByUserDisplayName, answeredAt: convertSaoPauloToUtc(nowInSaoPaulo()) }
        });
        return { success: true, message: "Resposta enviada com sucesso." };
      } catch (error) {
        console.error("Error answering question:", error);
        return { success: false, message: "Falha ao enviar resposta."};
      }
  }


  async createLot(data: Partial<LotFormData>, tenantId?: string): Promise<{ success: boolean; message: string; lotId?: string; }> {
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

      const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
      if (!auction) {
        return { success: false, message: "Leilão não encontrado." };
      }
      
      const finalTenantId = tenantId || auction.tenantId;

      if (!finalCategoryId) {
          return { success: false, message: "A categoria é obrigatória para o lote."}
      }

      // Prepara os dados para o Prisma, convertendo os campos numéricos e removendo os que não pertencem ao modelo Lot.
      const dataToCreate: Prisma.LotCreateInput = {
        ...(lotData as any),
        type: type as string,
        price: Number(lotData.price) || Number(lotData.initialPrice) || 0,
        publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(lotData.title || ''),
        auction: { connect: { id: auctionId } },
        category: { connect: { id: finalCategoryId } },
        isRelisted: data.isRelisted || false,
        relistCount: data.relistCount || 0,
        tenant: { connect: { id: finalTenantId } },
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
      if (data.hasOwnProperty('inheritedMediaFromBemId') && data.inheritedMediaFromBemId) {
        dataToCreate.inheritedMediaFromBemId = data.inheritedMediaFromBemId;
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
        stageDetails,
        ...lotData 
      } = data;

      const dataToUpdate: Prisma.LotUpdateInput = { 
          ...(lotData as any),
          price: lotData.price ? Number(lotData.price) : undefined,
          allowInstallmentBids: data.allowInstallmentBids,
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
      await this.repository.update(id, dataToUpdate, bemIds);

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
                  winDate: nowInSaoPaulo(),
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
}
