
// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Lot, LotFormData, BidInfo, UserLotMaxBid, Review, LotQuestion, LotStatus, Auction } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, Prisma } from '@prisma/client';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';
import { AssetService } from './asset.service';

// Inicializa o cliente Prisma
const prisma = new PrismaClient();

const NON_PUBLIC_LOT_STATUSES: LotStatus[] = ['RASCUNHO', 'CANCELADO'];
const NON_PUBLIC_AUCTION_STATUSES: Prisma.AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];


export class LotService {
  private repository: LotRepository;
  private auctionRepository: AuctionRepository;
  private prisma: PrismaClient;
  private assetService: AssetService;

  constructor() {
    this.repository = new LotRepository();
    this.auctionRepository = new AuctionRepository();
    this.prisma = prisma;
    this.assetService = new AssetService();
  }

  private mapLotWithDetails(lot: any): Lot {
    if (!lot) return null as any;
    const assets = lot.assets?.map((la: any) => la.asset).filter(Boolean) || [];
    return {
      ...lot,
      id: lot.id?.toString(),
      auctionId: lot.auctionId?.toString(),
      categoryId: lot.categoryId?.toString(),
      subcategoryId: lot.subcategoryId?.toString(),
      sellerId: lot.sellerId?.toString(),
      tenantId: lot.tenantId?.toString(),
      price: lot.price ? Number(lot.price) : 0,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      currentBidAmount: lot.currentBidAmount ? Number(lot.currentBidAmount) : null,
      assets: assets.map((asset: any) => ({
        ...asset,
        id: asset.id.toString(),
        evaluationValue: asset.evaluationValue ? Number(asset.evaluationValue) : null,
      })),
      assetIds: assets.map((a: any) => a.id.toString()),
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
      sellerName: lot.seller?.name,
      winningBidId: lot.winningBidId?.toString(),
      winningBidderId: lot.winningBidderId?.toString(),
      winnerId: lot.winnerId?.toString(),
      originalLotId: lot.originalLotId?.toString() ?? null,
      inheritedMediaFromAssetId: lot.inheritedMediaFromAssetId?.toString() ?? null,
    } as Lot;
  }

  async getLots(auctionId?: string, tenantId?: string, limit?: number, isPublicCall = false): Promise<Lot[]> {
    const where: Prisma.LotWhereInput = {};
    if (auctionId) {
      where.auctionId = BigInt(auctionId);
    }
    
    const lotsFromRepo = await this.repository.findAll(tenantId, where, limit);

    const lots = lotsFromRepo.map(lot => this.mapLotWithDetails(lot));

    if (isPublicCall) {
        return lots.filter(lot => 
            lot &&
            !NON_PUBLIC_LOT_STATUSES.includes(lot.status) &&
            lot.auction && !NON_PUBLIC_AUCTION_STATUSES.includes(lot.auction.status)
        );
    }
    
    return lots.filter(Boolean);
  }

  async getLotsByIds(ids: string[], isPublicCall = false): Promise<Lot[]> {
    const idsAsBigInt = ids.map(id => BigInt(id));
    const lots = await this.repository.findByIds(idsAsBigInt);
    if (isPublicCall) {
      // Garante que mesmo buscando por ID, os status não públicos e de leilões não publicados sejam respeitados
      return lots.filter(lot => 
        lot &&
        !NON_PUBLIC_LOT_STATUSES.includes(lot.status) &&
        lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status)
      ).map(lot => this.mapLotWithDetails(lot));
    }
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async findLotById(id: string): Promise<Lot | null> {
    if (!id) return null;
  
    const whereClause: Prisma.LotWhereFirstInput = {
        OR: [
            { publicId: id },
        ],
    };
  
    if (/^\d+$/.test(id)) {
        (whereClause.OR as any[]).push({ id: BigInt(id) });
    }
    
    const lot = await this.prisma.lot.findFirst({
        where: whereClause,
        include: {
            assets: { include: { asset: true } },
            auction: true,
            seller: { select: { name: true } },
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
        },
    });
    
    if (!lot) return null;
    
    return this.mapLotWithDetails(lot);
  }
  

  async getLotById(id: string, tenantId?: string, isPublicCall = false): Promise<Lot | null> {
    const lot = await this.findLotById(id);
    if (!lot) return null;
    
    // Se for uma chamada pública, verificar se o lote e o leilão estão públicos
    if (isPublicCall) {
      const isLotPublic = !NON_PUBLIC_LOT_STATUSES.includes(lot.status);
      const isAuctionPublic = lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status);
      
      if (!isLotPublic || !isAuctionPublic) {
        return null;
      }
    }
    
    // Se for uma chamada com tenantId, verificar se o lote pertence ao tenant
    if (tenantId && lot.tenantId.toString() !== tenantId) {
      return null;
    }
    
    return this.mapLotWithDetails(lot);
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
      const bids = await this.prisma.bid.findMany({
        where: { lotId: BigInt(lotId) },
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
      const lot = await this.repository.findById(lotId);
      if (!lot) {
        return { success: false, message: 'Lote não encontrado.' };
      }

      // Verificar se o lote está ativo
      if (lot.status !== 'ABERTO_PARA_LANCES') {
        return { success: false, message: 'Este lote não está mais disponível para lances.' };
      }

      // Verificar se o lance é maior que o lance atual
      if (lot.price && amount <= Number(lot.price)) {
        return { 
          success: false, 
          message: `O lance deve ser maior que o valor atual de ${lot.price}.` 
        };
      }

      // Verificar se o leilão ainda está ativo
      const auction = await this.auctionRepository.findById(lot.tenantId.toString(), lot.auctionId.toString());
      if (!auction || auction.status !== 'ABERTO_PARA_LANCES') {
        return { success: false, message: 'Este leilão não está mais ativo.' };
      }

      // Usar transação para garantir consistência
      await this.prisma.$transaction(async (tx) => {
        // 1. Criar o lance
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

        // 2. Atualizar o lance atual do lote
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
                assignedBy: 'system', 
                assignedAt: new Date()
              })),
            });
            
            await tx.asset.updateMany({
              where: { id: { in: assetIdsBigInt } },
              data: { status: 'LOTEADO' }
            });
          }
        }
      });
      
      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error) {
      console.error('Erro ao atualizar lote:', error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao atualizar lote: ${error.message}` 
          : 'Erro desconhecido ao atualizar lote' 
      };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const lotId = BigInt(id);
      
      await this.prisma.$transaction(async (tx) => {
        const assetsOnLots = await tx.assetsOnLots.findMany({
          where: { lotId },
          select: { assetId: true }
        });
        
        const assetIds = assetsOnLots.map(a => a.assetId);
        
        await tx.assetsOnLots.deleteMany({
          where: { lotId }
        });
        
        await tx.lot.delete({
          where: { id: lotId }
        });
        
        if (assetIds.length > 0) {
          await tx.asset.updateMany({
            where: { id: { in: assetIds } },
            data: { status: 'DISPONIVEL' }
          });
        }
      });
      
      return { success: true, message: 'Lote excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.deleteLot for id ${id}:`, error);
      return { success: false, message: error instanceof Error ? `Erro ao excluir lote: ${error.message}` : 'Erro desconhecido ao excluir lote' };
    }
  }
  
  async finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
    try {
      const lot = await this.repository.findById(lotId);
      if (!lot) {
        return { success: false, message: 'Lote não encontrado.' };
      }

      await this.prisma.$transaction(async (tx) => {
        const winningBid = await tx.bid.findFirst({
          where: { lotId: BigInt(lotId) },
          orderBy: { amount: 'desc' }
        });

        const sold = !!winningBid;
        const updateData: Prisma.LotUpdateInput = {
          status: sold ? 'VENDIDO' : 'NAO_VENDIDO',
          updatedAt: new Date()
        };

        if (sold && winningBid) {
          updateData.winner = { connect: { id: winningBid.bidderId } };
          updateData.price = winningBid.amount;
        }
        
        await tx.lot.update({
          where: { id: BigInt(lotId) },
          data: updateData
        });

        const assetsOnLots = await tx.assetsOnLots.findMany({
          where: { lotId: BigInt(lotId) },
          select: { assetId: true }
        });

        if (assetsOnLots.length > 0) {
          const assetIds = assetsOnLots.map(a => a.assetId);
          
          await tx.asset.updateMany({
            where: { id: { in: assetIds } },
            data: { 
              status: sold ? 'VENDIDO' : 'DISPONIVEL',
              updatedAt: new Date()
            }
          });
        }

        if (sold && winningBid) {
          await tx.userWin.create({
            data: {
              lot: { connect: { id: BigInt(lotId) } },
              user: { connect: { id: winningBid.bidderId } },
              winningBidAmount: winningBid.amount,
              winDate: new Date()
            }
          });
        }
      });

      return { 
        success: true, 
        message: `Lote ${sold ? 'vendido' : 'marcado como não vendido'} com sucesso.` 
      };
    } catch (error) {
      console.error('Erro ao finalizar lote:', error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao finalizar lote: ${error.message}` 
          : 'Erro desconhecido ao finalizar o lote' 
      };
    }
  }

  async createLot(
    lotData: {
      assetIds?: string[];
      auctionId: string;
      title: string;
      description?: string | null;
      status?: LotStatus;
      price?: number | string | Prisma.Decimal;
      initialPrice?: number | string | Prisma.Decimal | null;
      secondInitialPrice?: number | string | Prisma.Decimal | null;
      bidIncrementStep?: number | string | Prisma.Decimal | null;
      number?: string | null;
      slug?: string | null;
      lotSpecificAuctionDate?: Date | null;
      secondAuctionDate?: Date | null;
      bidsCount?: number;
      views?: number;
      isRelisted?: boolean;
      relistCount?: number;
      isFeatured?: boolean;
      isExclusive?: boolean;
      condition?: string | null;
      dataAiHint?: string | null;
      imageUrl?: string | null;
      galleryImageUrls?: any;
      mediaItemIds?: any;
      categoryId?: string | null;
      subcategoryId?: string | null;
      sellerId?: string | null;
      auctioneerId?: string | null;
      type?: string;
    },
    tenantId: string,
    userId: string = 'system'
  ): Promise<{ success: boolean; message: string; lotId?: string }> {
    try {
      if (!lotData.title || !lotData.auctionId) {
        return { 
          success: false, 
          message: 'Título e ID do leilão são obrigatórios para criar um lote.' 
        };
      }

      const { 
        assetIds = [],
        auctionId,
        ...cleanData 
      } = lotData as any;
      
      const toDecimal = (value?: number | string | Prisma.Decimal | null): Prisma.Decimal | null => {
        if (value === null || value === undefined) return null;
        return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
      };

      const auction = await this.auctionRepository.findById(tenantId, auctionId);
      if (!auction) {
        return {
            success: false,
            message: 'Leilão não encontrado para criar o lote.'
        };
      }
      const lotType = lotData.type || auction.auctionType || 'EXTRAJUDICIAL';

      const lotCreateInput: Prisma.LotCreateInput = {
        title: lotData.title,
        description: lotData.description || null,
        status: lotData.status || 'RASCUNHO',
        price: toDecimal(lotData.price) || new Prisma.Decimal(0),
        initialPrice: toDecimal(lotData.initialPrice),
        secondInitialPrice: toDecimal(lotData.secondInitialPrice),
        bidIncrementStep: toDecimal(lotData.bidIncrementStep),
        publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`,
        number: lotData.number || null,
        slug: lotData.slug || slugify(lotData.title),
        type: lotType,
        auction: { connect: { id: BigInt(auctionId) } },
        tenant: { connect: { id: BigInt(tenantId) } }
      };

      if (cleanData.categoryId) {
        lotCreateInput.category = { connect: { id: BigInt(cleanData.categoryId) } };
      }
      if (cleanData.sellerId) {
        lotCreateInput.seller = { connect: { id: BigInt(cleanData.sellerId) } };
      }
      
      const result = await this.prisma.$transaction(async (tx) => {
        const newLot = await tx.lot.create({
          data: lotCreateInput,
          select: { id: true }
        });

        if (assetIds && assetIds.length > 0) {
          const assetIdsToAssociate = assetIds.map(id => BigInt(id));
          
          await tx.assetsOnLots.createMany({
            data: assetIdsToAssociate.map(assetId => ({
              lotId: newLot.id,
              assetId: assetId,
              assignedBy: userId,
              assignedAt: new Date()
            })),
          });

          await tx.asset.updateMany({
            where: { id: { in: assetIdsToAssociate } },
            data: { status: 'LOTEADO' }
          });
        }

        return { 
          success: true, 
          message: 'Lote criado com sucesso.',
          lotId: newLot.id.toString()
        };
      });

      return result;
    } catch (error) {
      console.error('Error creating lot in service:', error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao criar lote: ${error.message}` 
          : 'Erro desconhecido ao criar o lote' 
      };
    }
  }

  async getReviews(lotId: string): Promise<Review[]> {
    return [];
  }
  
  async createReview(lotId: string, userId: string, userDisplayName: string, rating: number, comment: string): Promise<{ success: boolean; message: string; reviewId?: string }> {
    return { success: false, message: 'Not implemented' };
  }

  async getQuestions(lotId: string): Promise<LotQuestion[]> {
    return [];
  }
  
  async createQuestion(lotId: string, userId: string, userDisplayName: string, questionText: string): Promise<{ success: boolean; message: string; questionId?: string }> {
    return { success: false, message: 'Not implemented' };
  }
  
  async answerQuestion(questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Not implemented' };
  }

  async placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean; message: string; }> {
    return { success: false, message: 'Not implemented' };
  }

  async getActiveUserMaxBid(lotId: string, userId: string): Promise<UserLotMaxBid | null> {
    return null;
  }
}

    