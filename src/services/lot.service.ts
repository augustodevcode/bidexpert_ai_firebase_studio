// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData, BidInfo, UserLotMaxBid, Review, LotQuestion } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaInstance } from '@/lib/prisma';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';
import { AssetService } from './asset.service';

const NON_PUBLIC_STATUSES: Prisma.LotStatus[] = ['RASCUNHO', 'CANCELADO'];

export class LotService {
  private repository: LotRepository;
  private prisma;
  private assetService: AssetService;

  constructor() {
    this.repository = new LotRepository();
    this.prisma = getPrismaInstance();
    this.assetService = new AssetService();
  }

  private mapLotWithDetails(lot: any): Lot {
    const assets = lot.assets?.map((la: any) => la.asset).filter(Boolean) || [];
    return {
      ...lot,
      price: lot.price ? Number(lot.price) : 0,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      assets: assets,
      assetIds: assets.map((a: any) => a.id),
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
      sellerName: lot.seller?.name,
    };
  }

  async getLots(auctionId?: string, tenantId?: string, limit?: number, isPublicCall = false): Promise<Lot[]> {
    const where: Prisma.LotWhereInput = {};
    if (auctionId) {
      where.auctionId = auctionId;
    }
    
    const lots = await this.repository.findAll(tenantId, where, limit, isPublicCall);
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async getLotsByIds(ids: string[], isPublicCall = false): Promise<Lot[]> {
    const lots = await this.repository.findByIds(ids);
    if (isPublicCall) {
      // Garante que mesmo buscando por ID, os status não públicos e de leilões não publicados sejam respeitados
      return lots.filter(lot => 
        !NON_PUBLIC_STATUSES.includes(lot.status) &&
        lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status)
      ).map(lot => this.mapLotWithDetails(lot));
    }
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async getLotById(id: string, tenantId?: string, isPublicCall = false): Promise<Lot | null> {
    const lot = await this.repository.findById(id, tenantId);
    if (!lot) return null;
    
    const isLotPublic = !NON_PUBLIC_STATUSES.includes(lot.status);
    const isAuctionPublic = lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status);

    if (isPublicCall && (!isLotPublic || !isAuctionPublic)) {
        return null;
    }
    return this.mapLotWithDetails(lot);
  }

  async placeBid(lotIdOrPublicId: string, userId: string, bidAmount: number, userDisplayName: string): Promise<{ success: boolean; message: string; updatedLot?: Partial<Lot>; newBid?: BidInfo; }> {
    try {
        const lot = await this.getLotById(lotIdOrPublicId);
        if (!lot) return { success: false, message: 'Lote não encontrado.' };

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.habilitationStatus !== 'HABILITADO') {
            return { success: false, message: "Apenas usuários com status 'HABILITADO' podem dar lances." };
        }
        
        const isHabilitadoForAuction = await this.prisma.auctionHabilitation.findUnique({
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

        const previousHighBid = await this.prisma.bid.findFirst({
            where: { lotId: lot.id },
            orderBy: { timestamp: 'desc' }
        });

        const newBid = await this.prisma.bid.create({
            data: {
                lotId: lot.id,
                auctionId: lot.auctionId,
                bidderId: userId,
                bidderDisplay: userDisplayName,
                amount: bidAmount,
                tenantId: lot.tenantId
            }
        });

        if (previousHighBid && previousHighBid.bidderId !== userId) {
            await this.prisma.notification.create({
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

    await this.prisma.userLotMaxBid.upsert({
        where: { userId_lotId: { userId, lotId } },
        update: { maxAmount, isActive: true },
        create: { userId, lotId, maxAmount, isActive: true }
    });
    
    return { success: true, message: "Lance máximo definido com sucesso!" };
  }

  async getActiveUserMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot || !userId) return null;

    return this.prisma.userLotMaxBid.findFirst({
        where: { userId: userId, lotId: lot.id, isActive: true }
    });
  }

  async getBidHistory(lotIdOrPublicId: string): Promise<BidInfo[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    return this.prisma.bid.findMany({ where: { lotId: lot.id }, orderBy: { timestamp: 'desc' } });
  }

  async getReviews(lotIdOrPublicId: string): Promise<Review[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    // @ts-ignore
    return this.prisma.review.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
  }

  async createReview(lotId: string, userId: string, userDisplayName: string, rating: number, comment: string): Promise<{ success: boolean; message: string; reviewId?: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote não encontrado." };

    try {
      // @ts-ignore
      const newReview = await this.prisma.review.create({
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
    return this.prisma.lotQuestion.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
  }

  async createQuestion(lotId: string, userId: string, userDisplayName: string, questionText: string): Promise<{ success: boolean; message: string; questionId?: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote não encontrado." };

    try {
      // @ts-ignore
      const newQuestion = await this.prisma.lotQuestion.create({
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
        // @ts-ignore
        await this.prisma.lotQuestion.update({
            where: { id: questionId },
            data: { answerText, answeredByUserId, answeredByUserDisplayName, answeredAt: nowInSaoPaulo() }
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
        assetIds, 
        categoryId, 
        auctionId, 
        type, 
        sellerId, 
        subcategoryId,
        stageDetails, // Captura os detalhes das etapas
        ...lotData 
      } = data;
      delete (lotData as any).tenantId; // Remove tenantId to avoid conflict
      const finalCategoryId = categoryId || type;

      if (!auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }

      const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
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
      
      const newLot = await this.repository.create(dataToCreate, assetIds || []);
      
      // Update the status of the linked 'assets' to 'LOTEADO'
      if (assetIds && assetIds.length > 0) {
        await this.prisma.asset.updateMany({
            where: { id: { in: assetIds } },
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
        assetIds, categoryId, subcategoryId, type, auctionId, 
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
      
      // A atualização dos ativos vinculados e a atualização dos detalhes das etapas são agora transacionais
      await this.repository.update(id, dataToUpdate, assetIds);

      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // Find the lot to get associated assetIds before deleting
      const lotToDelete = await this.prisma.lot.findUnique({
        where: { id },
        include: { assets: { select: { assetId: true } } },
      });

      if (lotToDelete) {
        const assetIdsToRelease = lotToDelete.assets.map(a => a.assetId);

        // The repository handles the transactional deletion of Lot and AssetsOnLots.
        await this.repository.delete(id);
        
        // After successful deletion, update the status of the previously linked assets
        if (assetIdsToRelease.length > 0) {
          await this.prisma.asset.updateMany({
            where: { id: { in: assetIdsToRelease } },
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

      const winningBid = await this.prisma.bid.findFirst({
          where: { lotId: lot.id },
          orderBy: { amount: 'desc' },
      });

      if (winningBid) {
          await this.prisma.lot.update({
              where: { id: lot.id },
              data: { status: 'VENDIDO', winnerId: winningBid.bidderId, price: winningBid.amount },
          });
           await this.prisma.userWin.create({
              data: {
                  lotId: lot.id,
                  userId: winningBid.bidderId,
                  winningBidAmount: winningBid.amount,
                  winDate: nowInSaoPaulo()
              }
          });
          // After sale, update the associated 'asset' status to 'VENDIDO'
           if (lot.assetIds && lot.assetIds.length > 0) {
                await this.prisma.asset.updateMany({
                    where: { id: { in: lot.assetIds } },
                    data: { status: 'VENDIDO' },
                });
            }
          return { success: true, message: `Lote finalizado! Vencedor: ${winningBid.bidderDisplay} com R$ ${winningBid.amount.toLocaleString('pt-BR')}.`};
      } else {
           await this.prisma.lot.update({
              where: { id: lot.id },
              data: { status: 'NAO_VENDIDO' },
          });
          // If not sold, release the 'assets' back to 'DISPONIVEL'
           if (lot.assetIds && lot.assetIds.length > 0) {
                await this.prisma.asset.updateMany({
                    where: { id: { in: lot.assetIds } },
                    data: { status: 'DISPONIVEL' },
                });
            }
           return { success: true, message: "Lote finalizado como 'Não Vendido' por falta de lances." };
      }
  }
}
