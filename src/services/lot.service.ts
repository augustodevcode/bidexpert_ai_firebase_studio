import { PrismaClient, Lot as PmLot, Auction as PmAuction, Bid, LotStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { 
  Lot,
  LotFormData, 
  LotQuestion, 
  Review, 
  SellerProfileInfo, 
  AuctioneerProfileInfo, 
  BidInfo, 
  UserLotMaxBid 
} from '@/types';
import { LotQuestionService } from '@/services/lot-question.service';
import { ReviewService } from '@/services/review.service';
import { SellerService } from '@/services/seller.service';
import { AuctioneerService } from '@/services/auctioneer.service';

const NON_PUBLIC_LOT_STATUSES: LotStatus[] = ['RASCUNHO', 'CANCELADO', 'RETIRADO'];
const NON_PUBLIC_AUCTION_STATUSES = ['RASCUNHO', 'EM_PREPARACAO', 'SUSPENSO', 'CANCELADO'];

export class LotService {
  private prisma: PrismaClient;
  private repository: any; 
  private auctionRepository: any;
  private lotQuestionService: LotQuestionService;
  private reviewService: ReviewService;
  private sellerService: SellerService;
  private auctioneerService: AuctioneerService;

  constructor() {
    this.prisma = prisma;
    this.repository = {};
    this.auctionRepository = {};
    this.lotQuestionService = new LotQuestionService();
    this.reviewService = new ReviewService();
    this.sellerService = new SellerService();
    this.auctioneerService = new AuctioneerService();
  }

  private mapLotWithDetails(lot: any): Lot {
    return {
      ...lot,
      id: lot.id.toString(),
      auctionId: lot.auctionId.toString(),
      tenantId: lot.tenantId.toString(),
      categoryId: lot.categoryId?.toString(),
      subcategoryId: lot.subcategoryId?.toString(),
      sellerId: lot.sellerId?.toString(),
      auctioneerId: lot.auctioneerId?.toString(),
      cityId: lot.cityId?.toString(),
      stateId: lot.stateId?.toString(),
      winnerId: lot.winnerId?.toString(),
      originalLotId: lot.originalLotId?.toString(),
      inheritedMediaFromAssetId: lot.inheritedMediaFromAssetId?.toString(),
      price: Number(lot.price),
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
      lotPrices: lot.lotPrices?.map((lp: any) => ({
        ...lp,
        id: lp.id.toString(),
        lotId: lp.lotId.toString(),
        auctionStageId: lp.auctionStageId.toString(),
        initialBid: Number(lp.initialBid)
      })),
      auction: lot.auction ? {
        ...lot.auction,
        id: lot.auction.id.toString(),
        tenantId: lot.auction.tenantId.toString(),
        auctionStages: lot.auction.stages?.map((s: any) => ({
            ...s,
            id: s.id.toString(),
            auctionId: s.auctionId.toString()
        }))
      } : undefined,
      assets: lot.assets?.map((a: any) => ({
          ...a.asset,
          id: a.asset.id.toString(),
          tenantId: a.asset.tenantId.toString()
      })),
      // UI Fields mapping
      totalArea: lot.assets?.reduce((acc: number, curr: any) => acc + (Number(curr.asset.totalArea) || 0), 0) || null,
      type: lot.type || (lot.assets?.[0]?.asset?.categoryId ? 'IMOVEL' : 'OUTRO'),
      occupancyStatus: lot.occupancyStatus || lot.assets?.[0]?.asset?.occupancyStatus || null
    } as Lot;
  }

  async findLotById(id: string, tenantId?: string): Promise<Lot | null> {
      try {
        let whereClause: Prisma.LotWhereUniqueInput;
        
        if (/^\d+$/.test(id)) {
            whereClause = { id: BigInt(id) };
        } else {
            whereClause = { publicId: id };
        }

        const lot = await this.prisma.lot.findUnique({
            where: whereClause,
            include: {
                auction: {
                    include: {
                        stages: { orderBy: { id: 'asc' } }
                    }
                },
                lotPrices: true,
                assets: {
                    include: {
                        asset: true
                    }
                }
            }
        });

        if (!lot) return null;

        if (tenantId && lot.tenantId.toString() !== String(tenantId)) {
            return null;
        }

        return this.mapLotWithDetails(lot);
      } catch (error) {
          console.error('Error in findLotById:', error);
          return null;
      }
  }

  async getLots(auctionId?: string, tenantId?: string, limit?: number, isPublicCall = false): Promise<Lot[]> {
    try {
        const where: any = {};
        if (auctionId) where.auctionId = BigInt(auctionId);
        if (tenantId) where.tenantId = BigInt(tenantId);
        
        if (isPublicCall) {
            where.status = { notIn: NON_PUBLIC_LOT_STATUSES };
            where.auction = {
                status: { notIn: NON_PUBLIC_AUCTION_STATUSES }
            };
        }

        const lots = await this.prisma.lot.findMany({
            where,
            include: {
                auction: {
                    include: {
                        stages: { orderBy: { id: 'asc' } }
                    }
                },
                lotPrices: true,
                assets: {
                    include: {
                        asset: true
                    }
                }
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return lots.map(lot => this.mapLotWithDetails(lot));
    } catch (error) {
        console.error('Error in getLots:', error);
        return [];
    }
  }

  async getLotById(id: string, tenantId?: string, isPublicCall = false): Promise<Lot | null> {
    console.log(`[LotService.getLotById] ID: ${id}, Tenant: ${tenantId}, Public: ${isPublicCall}`);
    const lot = await this.findLotById(id, tenantId);
    if (!lot) return null;
    
    if (isPublicCall) {
      const isLotPublic = !NON_PUBLIC_LOT_STATUSES.includes(lot.status);
      const isAuctionPublic = lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status);
      
      console.log(`[LotService.getLotById] Public Check - LotPublic: ${isLotPublic}, AuctionPublic: ${isAuctionPublic}`);
      if (!isLotPublic || !isAuctionPublic) {
        return null;
      }
    }
    
    if (tenantId && lot.tenantId.toString() !== String(tenantId)) {
      return null;
    }
    
    return lot; 
  }

  async getUserMaxBid(lotId: string, userId: string): Promise<UserLotMaxBid | null> {
    try {
      const maxBid = await this.prisma.userLotMaxBid.findUnique({
        where: {
          userId_lotId: {
            userId: BigInt(userId),
            lotId: BigInt(lotId)
          }
        }
      });

      if (!maxBid) return null;

      return {
        id: maxBid.id.toString(),
        userId: maxBid.userId.toString(),
        lotId: maxBid.lotId.toString(),
        maxAmount: Number(maxBid.maxAmount),
        isActive: maxBid.isActive,
        createdAt: maxBid.createdAt
      } as UserLotMaxBid;
    } catch (error) {
      console.error('Erro ao buscar lance máximo do usuário:', error);
      return null;
    }
  }

  async getBidHistory(lotId: string): Promise<BidInfo[]> {
    try {
      let numericLotId: bigint;
      if (/^\d+$/.test(lotId)) {
        numericLotId = BigInt(lotId);
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotId } });
        if (!lot) {
          console.warn(`Lote com publicId ${lotId} não encontrado`);
          return [];
        }
        numericLotId = lot.id;
      }

      const bids = await this.prisma.bid.findMany({
        where: { lotId: numericLotId },
        orderBy: { amount: 'desc' },
        take: 50
      });

      return bids.map(bid => ({
        id: bid.id.toString(),
        lotId: bid.lotId.toString(),
        auctionId: bid.auctionId.toString(),
        bidderId: bid.bidderId.toString(),
        tenantId: bid.tenantId.toString(),
        amount: Number(bid.amount),
        timestamp: bid.timestamp,
        bidderDisplay: bid.bidderDisplay
      }));
    } catch (error) {
      console.error('Erro ao buscar lances:', error);
      return [];
    }
  }

  async placeBid(lotId: string, userId: string, amount: number, bidderDisplay?: string): Promise<{ success: boolean; message: string; currentBid?: number }> {
    try {
      const lot = await this.prisma.lot.findUnique({ where: { id: BigInt(lotId) } });
      if (!lot) {
        return { success: false, message: 'Lote não encontrado.' };
      }

      if (lot.status !== 'ABERTO_PARA_LANCES') {
        return { success: false, message: 'Este lote não está mais disponível para lances.' };
      }

      if (lot.price && amount <= Number(lot.price)) {
        return { 
          success: false, 
          message: `O lance deve ser maior que o valor atual de ${lot.price}.` 
        };
      }

      const auction = await this.prisma.auction.findUnique({ where: { id: lot.auctionId } });
      if (!auction || auction.status !== 'ABERTO_PARA_LANCES') {
        return { success: false, message: 'Este leilão não está mais ativo.' };
      }

      await this.prisma.$transaction(async (tx) => {
        const bid = await tx.bid.create({
          data: {
            lot: { connect: { id: BigInt(lotId) } },
            auction: { connect: { id: BigInt(lot.auctionId) } },
            bidder: { connect: { id: BigInt(userId) } },
            amount: new Prisma.Decimal(amount),
            bidderDisplay: bidderDisplay || null,
            tenant: { connect: { id: BigInt(lot.tenantId) } }
          },
          select: {
            id: true,
            amount: true,
            bidderId: true,
            bidderDisplay: true
          }
        });

        await tx.lot.update({
          where: { id: BigInt(lotId) },
          data: {
            price: new Prisma.Decimal(amount),
            bidsCount: { increment: 1 },
            bids: {
              connect: { id: bid.id }
            },
            winner: { connect: { id: BigInt(userId) }},
            updatedAt: new Date()
          },
          select: {
            id: true,
            price: true,
            bidsCount: true,
            status: true
          }
        });
      });

      return { 
        success: true, 
        message: 'Lance realizado com sucesso!',
        currentBid: amount
      };
    } catch (error) {
      console.error('Erro ao realizar lance:', error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao realizar lance: ${error.message}` 
          : 'Erro desconhecido ao realizar lance' 
      };
    }
  }

  async createLot(data: Partial<LotFormData>, tenantId: string): Promise<{ success: boolean; message: string; lotId?: string }> {
    try {
      const { 
        assetIds = [],
        ...cleanData 
      } = data as any;

      if (!cleanData.auctionId) return { success: false, message: 'Leilão é obrigatório' };

      // Gera o publicId usando a máscara configurada
      const publicId = await generatePublicId(tenantId, 'lot');

      const createData: any = {
          ...cleanData,
          publicId,
          tenantId: BigInt(tenantId),
          auctionId: BigInt(cleanData.auctionId),
          createdAt: new Date(),
          updatedAt: new Date(),
      };

      if (cleanData.categoryId) createData.category = { connect: { id: BigInt(cleanData.categoryId) } };
      if (cleanData.subcategoryId) createData.subcategory = { connect: { id: BigInt(cleanData.subcategoryId) } };
      if (cleanData.sellerId) createData.seller = { connect: { id: BigInt(cleanData.sellerId) } };

      const lot = await this.prisma.lot.create({
        data: createData
      });

      const lotId = lot.id;

      if (Array.isArray(assetIds) && assetIds.length > 0) {
         await this.prisma.assetsOnLots.createMany({
            data: assetIds.map((assetId: string) => ({
              lotId,
              assetId: BigInt(assetId),
              tenantId: BigInt(tenantId),
              assignedBy: 'SYSTEM'
            }))
         });
      }

      return { success: true, message: 'Lote criado com sucesso', lotId: lotId.toString() };
    } catch (error) {
      console.error('Erro ao criar lote:', error);
      return { success: false, message: 'Erro ao criar lote' };
    }
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
      try {
          const lots = await this.prisma.lot.findMany({
              where: {
                  id: { in: ids.map(id => BigInt(id)) }
              },
              include: {
                auction: {
                    include: {
                        stages: { orderBy: { id: 'asc' } }
                    }
                },
                lotPrices: true,
                assets: {
                    include: {
                        asset: true
                    }
                }
            }
          });
          return lots.map(lot => this.mapLotWithDetails(lot));
      } catch (error) {
          console.error('Error in getLotsByIds:', error);
          return [];
      }
  }

  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const lotId = BigInt(id);
      
      const { 
        assetIds = [],
        ...cleanData 
      } = data as any;
      
      const updateRelations: Record<string, any> = {};
      
      if (cleanData.categoryId) {
        updateRelations.category = { connect: { id: BigInt(cleanData.categoryId) } };
      }
      
      if (cleanData.subcategoryId) {
        updateRelations.subcategory = { connect: { id: BigInt(cleanData.subcategoryId) } };
      }
      
      if (cleanData.sellerId) {
        updateRelations.seller = { connect: { id: BigInt(cleanData.sellerId) } };
      }
      
      await this.prisma.$transaction(async (tx) => {
        await tx.lot.update({
          where: { id: lotId },
          data: {
            ...cleanData,
            ...updateRelations,
            updatedAt: new Date()
          } as Prisma.LotUpdateInput
        });
        
        if (Array.isArray(assetIds)) {
          const assetIdsBigInt = assetIds
            .filter((id): id is string => Boolean(id))
            .map(id => BigInt(id));
          
          await tx.assetsOnLots.deleteMany({
            where: { lotId }
          });
          
          if (assetIdsBigInt.length > 0) {
            await tx.assetsOnLots.createMany({
              data: assetIdsBigInt.map(assetId => ({
                lotId,
                assetId,
                tenantId: BigInt(cleanData.tenantId || 1),
                assignedBy: 'SYSTEM'
              }))
            });
          }
        }
      });
      
      return { success: true, message: 'Lote atualizado com sucesso' };
    } catch (error) {
      console.error('Erro ao atualizar lote:', error);
      return { success: false, message: 'Erro ao atualizar lote' };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.lot.delete({
        where: { id: BigInt(id) }
      });
      return { success: true, message: 'Lote excluído com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      return { success: false, message: 'Erro ao excluir lote' };
    }
  }

  async finalizeLot(lotId: string, winnerId?: string, winningBidId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const data: any = {
          status: 'ARREMATADO',
          updatedAt: new Date()
      };

      if (winnerId) data.winnerId = BigInt(winnerId);
      if (winningBidId) data.winningBidId = BigInt(winningBidId);

      await this.prisma.lot.update({
        where: { id: BigInt(lotId) },
        data
      });
      
      return { success: true, message: 'Lote finalizado com sucesso' };
    } catch (error) {
      console.error('Erro ao finalizar lote:', error);
      return { success: false, message: 'Erro ao finalizar lote' };
    }
  }

  async placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean; message: string }> {
    try {
      let numericLotId: bigint;
      if (/^\d+$/.test(lotId)) {
        numericLotId = BigInt(lotId);
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotId } });
        if (!lot) {
          return { success: false, message: 'Lote não encontrado' };
        }
        numericLotId = lot.id;
      }

      await this.prisma.userLotMaxBid.upsert({
        where: {
          userId_lotId: {
            userId: BigInt(userId),
            lotId: numericLotId
          }
        },
        create: {
          userId: BigInt(userId),
          lotId: numericLotId,
          maxAmount: new Prisma.Decimal(maxAmount),
          isActive: true
        },
        update: {
          maxAmount: new Prisma.Decimal(maxAmount),
          isActive: true
        }
      });

      return { success: true, message: 'Lance máximo configurado com sucesso' };
    } catch (error) {
      console.error('Erro ao configurar lance máximo:', error);
      return { success: false, message: 'Erro ao configurar lance máximo' };
    }
  }

  async getActiveUserMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
    try {
      let numericLotId: bigint;
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = BigInt(lotIdOrPublicId);
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return null;
        numericLotId = lot.id;
      }

      const maxBid = await this.prisma.userLotMaxBid.findUnique({
        where: {
          userId_lotId: {
            userId: BigInt(userId),
            lotId: numericLotId
          }
        }
      });

      if (!maxBid || !maxBid.isActive) return null;

      return {
        id: maxBid.id.toString(),
        userId: maxBid.userId.toString(),
        lotId: maxBid.lotId.toString(),
        maxAmount: Number(maxBid.maxAmount),
        isActive: maxBid.isActive,
        createdAt: maxBid.createdAt
      } as UserLotMaxBid;
    } catch (error) {
      console.error('Erro ao buscar lance máximo ativo:', error);
      return null;
    }
  }

  async getReviews(lotIdOrPublicId: string): Promise<Review[]> {
    try {
      let numericLotId: string;
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = lotIdOrPublicId;
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return [];
        numericLotId = lot.id.toString();
      }

      const reviews = await this.reviewService.findByLotId(numericLotId);
      return reviews.map((review: any) => ({
        id: review.id.toString(),
        lotId: review.lotId.toString(),
        userId: review.userId.toString(),
        auctionId: review.auctionId.toString(),
        rating: review.rating,
        comment: review.comment,
        userDisplayName: review.userDisplayName,
        createdAt: review.createdAt
      }));
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }

  async createReview(
    lotIdOrPublicId: string,
    userId: string,
    userDisplayName: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; message: string; reviewId?: string }> {
    try {
      let numericLotId: string;
      let auctionId: string;
      
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = lotIdOrPublicId;
        const lot = await this.prisma.lot.findUnique({ where: { id: BigInt(lotIdOrPublicId) } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
        auctionId = lot.auctionId.toString();
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
        numericLotId = lot.id.toString();
        auctionId = lot.auctionId.toString();
      }

      const review = await this.reviewService.create({
        lotId: numericLotId,
        userId,
        auctionId,
        rating,
        comment,
        userDisplayName
      });

      return { 
        success: true, 
        message: 'Avaliação criada com sucesso',
        reviewId: review.id.toString()
      };
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      return { success: false, message: 'Erro ao criar avaliação' };
    }
  }

  async getQuestions(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    try {
      let numericLotId: string;
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = lotIdOrPublicId;
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return [];
        numericLotId = lot.id.toString();
      }

      const questions = await this.lotQuestionService.findByLotId(numericLotId);
      return questions.map((question: any) => ({
        id: question.id.toString(),
        lotId: question.lotId.toString(),
        userId: question.userId.toString(),
        auctionId: question.auctionId.toString(),
        question: question.question,
        answer: question.answer,
        userDisplayName: question.userDisplayName,
        answeredByUserId: question.answeredByUserId?.toString(),
        answeredByUserDisplayName: question.answeredByUserDisplayName,
        answeredAt: question.answeredAt,
        createdAt: question.createdAt
      }));
    } catch (error) {
      console.error('Erro ao buscar perguntas:', error);
      return [];
    }
  }

  async createQuestion(
    lotIdOrPublicId: string,
    userId: string,
    userDisplayName: string,
    questionText: string
  ): Promise<{ success: boolean; message: string; questionId?: string }> {
    try {
      let numericLotId: bigint;
      let auctionId: bigint;
      
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = BigInt(lotIdOrPublicId);
        const lot = await this.prisma.lot.findUnique({ where: { id: numericLotId } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
        auctionId = lot.auctionId;
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
        numericLotId = lot.id;
        auctionId = lot.auctionId;
      }

      const question = await this.lotQuestionService.create({
        lotId: numericLotId,
        userId: BigInt(userId),
        auctionId,
        question: questionText,
        userDisplayName
      });

      return { 
        success: true, 
        message: 'Pergunta criada com sucesso',
        questionId: question.id.toString()
      };
    } catch (error) {
      console.error('Erro ao criar pergunta:', error);
      return { success: false, message: 'Erro ao criar pergunta' };
    }
  }

  async answerQuestion(
    questionId: string,
    answerText: string,
    answeredByUserId: string,
    answeredByUserDisplayName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.lotQuestionService.addAnswer(
        questionId,
        answerText,
        answeredByUserId,
        answeredByUserDisplayName
      );

      return { success: true, message: 'Resposta adicionada com sucesso' };
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
      return { success: false, message: 'Erro ao adicionar resposta' };
    }
  }

  async getLotDetailsForV2(lotIdOrPublicId: string): Promise<{
    lot: Lot;
    auction: any;
    seller: SellerProfileInfo | null;
    auctioneer: AuctioneerProfileInfo | null;
    bids: BidInfo[];
    questions: LotQuestion[];
    reviews: Review[];
  } | null> {
    try {
      const lot = await this.getLotById(lotIdOrPublicId, undefined, true);
      if (!lot) return null;

      const [bids, questions, reviews] = await Promise.all([
        this.getBidHistory(lotIdOrPublicId),
        this.getQuestions(lotIdOrPublicId),
        this.getReviews(lotIdOrPublicId)
      ]);

      let seller: SellerProfileInfo | null = null;
      if (lot.auction?.sellerId) {
        seller = await this.sellerService.getSellerById('1', lot.auction.sellerId);
      }

      let auctioneer: AuctioneerProfileInfo | null = null;
      if (lot.auction?.auctioneerId) {
        auctioneer = await this.auctioneerService.getAuctioneerById('1', lot.auction.auctioneerId);
      }

      return {
        lot,
        auction: lot.auction,
        seller,
        auctioneer,
        bids,
        questions,
        reviews
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes do lote:', error);
      return null;
    }
  }
}

export const lotService = new LotService();