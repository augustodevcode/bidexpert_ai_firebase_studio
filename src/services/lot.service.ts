
// src/services/lot.service.ts
/**
 * @fileoverview Este arquivo contém a classe LotService, que encapsula a
 * lógica de negócio para o gerenciamento de Lotes. Ele atua como um
 * intermediário entre as server actions (controllers) e o repositório de lotes,
 * aplicando regras como validação de lances, atualização de status e
 * tratamento de dados antes de serem enviados para a camada de visualização.
 */
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData, BidInfo, UserLotMaxBid, Review, LotQuestion, Asset } from '@/types';
import { slugify, isValidImageUrl } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';
import { AssetService } from './asset.service';

const NON_PUBLIC_STATUSES: Prisma.LotStatus[] = ['RASCUNHO', 'CANCELADO'];

export class LotService {
  private repository: LotRepository;
  private prisma;
  private assetService: AssetService;

  constructor() {
    this.repository = new LotRepository();
    this.prisma = prisma;
    this.assetService = new AssetService();
  }
  
  async getLotDetailsForV2(lotIdOrPublicId: string) {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return null;

    const [auction, seller, auctioneer, bids, questions, reviews] = await Promise.all([
        this.prisma.auction.findUnique({ where: { id: lot.auctionId }, include: { stages: true } }),
        lot.sellerId ? this.prisma.seller.findUnique({ where: { id: lot.sellerId } }) : null,
        lot.auctioneerId ? this.prisma.auctioneer.findUnique({ where: { id: lot.auctioneerId } }) : null,
        this.getBidHistory(lotIdOrPublicId),
        this.getQuestions(lotIdOrPublicId),
        this.getReviews(lotIdOrPublicId),
    ]);
    
    if (!auction) return null;

    return { lot, auction, seller, auctioneer, bids, questions, reviews };
  }

  private mapLotWithDetails(lot: any): Lot {
    const assets: Asset[] = lot.assets?.map((la: any) => la.asset).filter(Boolean) || [];
    
    // Lógica de herança de mídia centralizada aqui
    const inheritedAsset = (lot.inheritedMediaFromAssetId && assets.length > 0)
      ? assets.find((a: any) => a.id.toString() === lot.inheritedMediaFromAssetId.toString())
      : null;
    
    const finalImageUrl = inheritedAsset?.imageUrl || lot.imageUrl;

    return {
      ...lot,
      id: lot.id.toString(),
      auctionId: lot.auctionId.toString(),
      price: lot.price ? Number(lot.price) : 0,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      assets: assets.map((a: any) => ({
          ...a,
          id: a.id.toString(),
          evaluationValue: a.evaluationValue ? Number(a.evaluationValue) : null,
      })),
      assetIds: assets.map((a: any) => a.id.toString()),
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryId: lot.subcategoryId?.toString() || null,
      sellerId: lot.sellerId?.toString() || null,
      auctioneerId: lot.auctioneerId?.toString() || null,
      cityId: lot.cityId?.toString() || null,
      stateId: lot.stateId?.toString() || null,
      winnerId: lot.winnerId?.toString() || null,
      originalLotId: lot.original_lot_id?.toString() || null,
      subcategoryName: lot.subcategory?.name || null,
      sellerName: lot.seller?.name || null,
      imageUrl: finalImageUrl, // Usando a URL final determinada pela lógica de herança
      stageDetails: lot.stageDetails ? JSON.parse(lot.stageDetails as string) : null,
    };
  }

  async getLots(auctionId?: string, tenantId?: string, limit?: number, isPublicCall = false): Promise<Lot[]> {
    const where: Prisma.LotWhereInput = {};
    if (auctionId) {
      where.auctionId = BigInt(auctionId);
    }
    
    const lots = await this.repository.findAll(tenantId, where, limit, isPublicCall);
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async getLotsByIds(ids: string[], isPublicCall = false): Promise<Lot[]> {
    const bigIntIds = ids.map(id => BigInt(id));
    const lots = await this.repository.findByIds(bigIntIds);
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

        const user = await this.prisma.user.findUnique({ where: { id: BigInt(userId) } });
        if (!user || user.habilitationStatus !== 'HABILITADO') {
            return { success: false, message: "Apenas usuários com status 'HABILITADO' podem dar lances." };
        }
        
        const isHabilitadoForAuction = await this.prisma.auctionHabilitation.findUnique({
            where: { userId_auctionId: { userId: BigInt(userId), auctionId: BigInt(lot.auctionId) } }
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
            where: { lotId: BigInt(lot.id) },
            orderBy: { timestamp: 'desc' }
        });

        const newBid = await this.prisma.bid.create({
            data: {
                lotId: BigInt(lot.id),
                auctionId: BigInt(lot.auctionId),
                bidderId: BigInt(userId),
                bidderDisplay: userDisplayName,
                amount: bidAmount,
                tenantId: BigInt(lot.tenantId)
            }
        });

        if (previousHighBid && previousHighBid.bidderId !== BigInt(userId)) {
            await this.prisma.notification.create({
                data: {
                    userId: previousHighBid.bidderId,
                    message: `Seu lance no lote "${lot.title}" foi superado.`,
                    link: `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`,
                    tenantId: BigInt(lot.tenantId),
                }
            });
        }
        
        const updatedLot = await this.repository.update(lot.id, { price: bidAmount, bidsCount: { increment: 1 } });
        
        return {
            success: true,
            message: "Lance realizado com sucesso!",
            updatedLot: {
                price: Number(updatedLot.price),
                bidsCount: updatedLot.bidsCount,
            },
            newBid: { ...newBid, id: newBid.id.toString(), lotId: newBid.lotId.toString(), auctionId: newBid.auctionId.toString(), bidderId: newBid.bidderId.toString(), tenantId: newBid.tenantId.toString(), amount: Number(newBid.amount) },
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
        where: { userId_lotId: { userId: BigInt(userId), lotId: BigInt(lotId) } },
        update: { maxAmount, isActive: true },
        create: { userId: BigInt(userId), lotId: BigInt(lotId), maxAmount, isActive: true }
    });
    
    return { success: true, message: "Lance máximo definido com sucesso!" };
  }

  async getActiveUserMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot || !userId) return null;

    const maxBid = await this.prisma.userLotMaxBid.findFirst({
        where: { userId: BigInt(userId), lotId: BigInt(lot.id), isActive: true }
    });

    if(!maxBid) return null;
    return { ...maxBid, id: maxBid.id.toString(), userId: maxBid.userId.toString(), lotId: maxBid.lotId.toString(), maxAmount: Number(maxBid.maxAmount) };
  }

  async getBidHistory(lotIdOrPublicId: string): Promise<BidInfo[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    const bids = await this.prisma.bid.findMany({ where: { lotId: BigInt(lot.id) }, orderBy: { timestamp: 'desc' } });
    return bids.map(b => ({...b, id: b.id.toString(), lotId: b.lotId.toString(), auctionId: b.auctionId.toString(), bidderId: b.bidderId.toString(), tenantId: b.tenantId.toString(), amount: Number(b.amount) }));
  }

  async getReviews(lotIdOrPublicId: string): Promise<Review[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    const reviews = await this.prisma.review.findMany({ where: { lotId: BigInt(lot.id) }, orderBy: { createdAt: 'desc' } });
    return reviews.map(r => ({...r, id: r.id.toString(), lotId: r.lotId.toString(), auctionId: r.auctionId.toString(), userId: r.userId.toString() }));
  }

  async createReview(lotId: string, userId: string, userDisplayName: string, rating: number, comment: string): Promise<{ success: boolean; message: string; reviewId?: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote não encontrado." };

    try {
      const newReview = await this.prisma.review.create({
          data: { lotId: BigInt(lot.id), auctionId: BigInt(lot.auctionId), userId: BigInt(userId), userDisplayName, rating, comment }
      });
      return { success: true, message: 'Avaliação enviada com sucesso.', reviewId: newReview.id.toString() };
    } catch(error) {
      console.error("Error creating review:", error);
      return { success: false, message: "Falha ao enviar avaliação." };
    }
  }

  async getQuestions(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    const lot = await this.getLotById(lotIdOrPublicId);
    if (!lot) return [];
    const questions = await this.prisma.lotQuestion.findMany({ where: { lotId: BigInt(lot.id) }, orderBy: { createdAt: 'desc' } });
    return questions.map(q => ({...q, id: q.id.toString(), lotId: q.lotId.toString(), auctionId: q.auctionId.toString(), userId: q.userId.toString() }));
  }

  async createQuestion(lotId: string, userId: string, userDisplayName: string, questionText: string): Promise<{ success: boolean; message: string; questionId?: string }> {
    const lot = await this.getLotById(lotId);
    if (!lot) return { success: false, message: "Lote não encontrado." };

    try {
      const newQuestion = await this.prisma.lotQuestion.create({
          data: { lotId: BigInt(lot.id), auctionId: BigInt(lot.auctionId), userId: BigInt(userId), userDisplayName, questionText, isPublic: true }
      });
      return { success: true, message: 'Pergunta enviada com sucesso.', questionId: newQuestion.id.toString() };
    } catch(error) {
      console.error("Error creating question:", error);
      return { success: false, message: "Falha ao enviar pergunta." };
    }
  }
  
  async answerQuestion(questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string }> {
      try {
        await this.prisma.lotQuestion.update({
            where: { id: BigInt(questionId) },
            data: { answerText, answeredByUserId: BigInt(answeredByUserId), answeredByUserDisplayName, answeredAt: nowInSaoPaulo() }
        });
        return { success: true, message: "Resposta enviada com sucesso." };
      } catch (error) {
        console.error("Error answering question:", error);
        return { success: false, message: "Falha ao enviar resposta."};
      }
  }


  async createLot(data: Partial<LotFormData>, tenantId: string, creatorId?: string): Promise<{ success: boolean; message: string; lotId?: string; }> {
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
      const finalCategoryId = categoryId || type;

      if (!auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }

      const auction = await this.prisma.auction.findUnique({ where: { id: BigInt(auctionId) } });
      if (!auction) {
        return { success: false, message: "Leilão não encontrado." };
      }
      
      const finalTenantId = tenantId || auction.tenantId.toString();

      if (!finalCategoryId) {
          return { success: false, message: "A categoria é obrigatória para o lote."}
      }
      
      const category = await this.prisma.lotCategory.findUnique({ where: { id: BigInt(finalCategoryId) } });
      if (!category) {
        return { success: false, message: "Categoria do lote não encontrada." };
      }

      const dataToCreate: Prisma.LotCreateInput = {
        ...(lotData as any),
        type: type as string,
        price: Number(lotData.price) || Number(lotData.initialPrice) || 0,
        publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(lotData.title || ''),
        auction: { connect: { id: BigInt(auctionId) } },
        category: { connect: { id: BigInt(finalCategoryId) } },
        isRelisted: data.isRelisted || false,
        relistCount: data.relistCount || 0,
        tenant: { connect: { id: BigInt(finalTenantId) } },
      };

      if (data.originalLotId) {
        dataToCreate.originalLot = { connect: { id: BigInt(data.originalLotId) } };
      }
      if (sellerId) {
        dataToCreate.seller = { connect: { id: BigInt(sellerId) } };
      }
      if (data.auctioneerId) {
        dataToCreate.auctioneer = { connect: { id: BigInt(data.auctioneerId) } };
      }
      if (subcategoryId) {
        dataToCreate.subcategory = { connect: { id: BigInt(subcategoryId) } };
      }
      if (data.hasOwnProperty('inheritedMediaFromAssetId') && data.inheritedMediaFromAssetId) {
        dataToCreate.inheritedMediaFromAssetId = BigInt(data.inheritedMediaFromAssetId as string);
      }
      
      const newLot = await this.repository.create(dataToCreate, (assetIds || []).map(id => BigInt(id)), creatorId || '');
      
      // Update the status of the linked 'assets' to 'LOTEADO'
      if (assetIds && assetIds.length > 0) {
        await this.prisma.asset.updateMany({
            where: { id: { in: assetIds.map(id => BigInt(id)) } },
            data: { status: 'LOTEADO' },
        });
      }
      
      return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id.toString() };
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
        dataToUpdate.category = { connect: { id: BigInt(finalCategoryId) } };
      }
      if (auctionId) {
        dataToUpdate.auction = { connect: { id: BigInt(auctionId) } };
      }
      if (subcategoryId) {
        dataToUpdate.subcategory = { connect: { id: BigInt(subcategoryId) } };
      } else if (data.hasOwnProperty('subcategoryId')) {
        dataToUpdate.subcategory = { disconnect: true };
      }
      if (sellerId) {
        dataToUpdate.seller = { connect: { id: BigInt(sellerId) } };
      }
      if (auctioneerId) {
        dataToUpdate.auctioneer = { connect: { id: BigInt(auctioneerId) } };
      }
      if (cityId) {
        dataToUpdate.city = { connect: { id: BigInt(cityId) } };
      }
      if (stateId) {
        dataToUpdate.state = { connect: { id: BigInt(stateId) } };
      }
      if (data.hasOwnProperty('inheritedMediaFromAssetId')) {
        dataToUpdate.inheritedMediaFromAssetId = BigInt(data.inheritedMediaFromAssetId as string);
      }
      
      await this.repository.update(id, dataToUpdate, assetIds?.map(id => BigInt(id)));

      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lotIdAsBigInt = BigInt(id);
      const lotToDelete = await this.prisma.lot.findUnique({
        where: { id: lotIdAsBigInt },
        include: { assets: { select: { assetId: true } } },
      });

      if (lotToDelete) {
        const assetIdsToRelease = lotToDelete.assets.map(a => a.assetId);

        await this.repository.delete(id);
        
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
          where: { lotId: BigInt(lot.id) },
          orderBy: { amount: 'desc' },
      });

      if (winningBid) {
          await this.prisma.lot.update({
              where: { id: BigInt(lot.id) },
              data: { status: 'VENDIDO', winnerId: winningBid.bidderId, price: winningBid.amount },
          });
           await this.prisma.userWin.create({
              data: {
                  lotId: BigInt(lot.id),
                  userId: winningBid.bidderId,
                  winningBidAmount: winningBid.amount,
                  winDate: nowInSaoPaulo()
              }
          });
           if (lot.assetIds && lot.assetIds.length > 0) {
                await this.prisma.asset.updateMany({
                    where: { id: { in: lot.assetIds.map(id => BigInt(id)) } },
                    data: { status: 'VENDIDO' },
                });
            }
          return { success: true, message: `Lote finalizado! Vencedor: ${winningBid.bidderDisplay} com R$ ${Number(winningBid.amount).toLocaleString('pt-BR')}.`};
      } else {
           await this.prisma.lot.update({
              where: { id: BigInt(lot.id) },
              data: { status: 'NAO_VENDIDO' },
          });
           if (lot.assetIds && lot.assetIds.length > 0) {
                await this.prisma.asset.updateMany({
                    where: { id: { in: lot.assetIds.map(id => BigInt(id)) } },
                    data: { status: 'DISPONIVEL' },
                });
            }
           return { success: true, message: "Lote finalizado como 'Não Vendido' por falta de lances." };
      }
  }
}
