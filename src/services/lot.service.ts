import { PrismaClient, Lot, Auction, Bid, LotStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { 
  LotFormData, 
  LotQuestion, 
  Review, 
  SellerProfileInfo, 
  AuctioneerProfileInfo, 
  BidInfo, 
  UserLotMaxBid 
} from '@/types/lot';

const NON_PUBLIC_LOT_STATUSES: LotStatus[] = ['RASCUNHO', 'EM_ANALISE', 'REPROVADO', 'SUSPENSO'];
const NON_PUBLIC_AUCTION_STATUSES = ['RASCUNHO', 'EM_PREPARACAO', 'EM_ANALISE', 'REPROVADO', 'SUSPENSO', 'CANCELADO'];

export class LotService {
  private prisma: PrismaClient;
  private repository: any; // Using any to bypass strict typing for now, ideally should be LotRepository
  private auctionRepository: any;

  constructor() {
    this.prisma = prisma;
    // Mock repositories for now as we are using direct prisma calls mostly
    this.repository = {
      findAll: async (tenantId: string | undefined, where: any, limit?: number) => {
        const query: any = { where };
        if (tenantId) query.where.tenantId = BigInt(tenantId);
        if (limit) query.take = limit;
        query.include = {
          auction: true,
          assets: { include: { asset: true } },
          category: true,
          subcategory: true,
          seller: true,
          bids: { orderBy: { amount: 'desc' }, take: 1 }
        };
        return this.prisma.lot.findMany(query);
      },
      findByIds: async (ids: bigint[]) => {
        return this.prisma.lot.findMany({
          where: { id: { in: ids } },
          include: {
            auction: true,
            assets: { include: { asset: true } },
            category: true,
            subcategory: true,
            seller: true,
            bids: { orderBy: { amount: 'desc' }, take: 1 }
          }
        });
      },
      findById: async (id: string) => {
        return this.prisma.lot.findUnique({
          where: { id: BigInt(id) },
          include: {
            auction: true,
            assets: { include: { asset: true } },
            category: true,
            subcategory: true,
            seller: true,
            bids: { orderBy: { amount: 'desc' }, take: 1 }
          }
        });
      }
    };
    this.auctionRepository = {
      findById: async (tenantId: string, id: string) => {
        return this.prisma.auction.findUnique({
          where: { id: BigInt(id), tenantId: BigInt(tenantId) }
        });
      }
    };
  }

  private mapLotWithDetails(lot: any): Lot {
    if (!lot) return lot;
    
    const assets = lot.assets || [];
    
    return {
      ...lot,
      id: lot.id.toString(),
      auctionId: lot.auctionId.toString(),
      categoryId: lot.categoryId?.toString() || null,
      subcategoryId: lot.subcategoryId?.toString() || null,
      sellerId: lot.sellerId?.toString() || null,
      winnerId: lot.winnerId?.toString() || null,
      tenantId: lot.tenantId?.toString(),
      price: lot.price ? Number(lot.price) : 0,
      initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? Number(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
      evaluationValue: lot.evaluationValue ? Number(lot.evaluationValue) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
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
      originalLotId: 'original_lot_id' in lot ? (lot as any).original_lot_id?.toString() : null,
      inheritedMediaFromAssetId: 'inheritedMediaFromAssetId' in lot ? (lot as any).inheritedMediaFromAssetId?.toString() : null,
    } as Lot;
  }

  async getLotDetailsForV2(lotId: string): Promise<{
    lot: Lot;
    auction: Auction;
    seller: SellerProfileInfo | null;
    auctioneer: AuctioneerProfileInfo | null;
    bids: BidInfo[];
    questions: LotQuestion[];
    reviews: Review[];
  } | null> {
    try {
      const lot = await this.prisma.lot.findFirst({
        where: {
          OR: [{ id: /^\d+$/.test(lotId) ? BigInt(lotId) : -1n }, { publicId: lotId }],
        },
        include: {
          auction: { include: { seller: true, auctioneer: true, stages: true, lots: true } },
          assets: { include: { asset: true } },
          bids: { orderBy: { timestamp: 'desc' }, take: 20 },
          questions: { orderBy: { createdAt: 'desc' } },
          reviews: { orderBy: { createdAt: 'desc' } },
          category: true,
          subcategory: true,
          seller: true,
        },
      });

      if (!lot || !lot.auction) {
        return null;
      }

      // Reusing the mapping logic
      const mappedLot = this.mapLotWithDetails(lot);
      
      // Map the auction properly with type casting
      const mappedAuction: Auction = {
        ...(lot.auction as any),
        id: lot.auction.id.toString(),
        totalLots: lot.auction.lots?.length ?? 0,
        sellerId: lot.auction.sellerId?.toString() ?? null,
        auctioneerId: lot.auction.auctioneerId?.toString() ?? null,
        categoryId: lot.auction.categoryId?.toString() ?? null,
        judicialProcessId: lot.auction.judicialProcessId?.toString() ?? null,
        tenantId: lot.auction.tenantId.toString(),
        seller: lot.auction.seller ? { ...lot.auction.seller, id: lot.auction.seller.id.toString(), tenantId: lot.auction.seller.tenantId.toString() } : null,
        auctioneer: lot.auction.auctioneer ? { ...lot.auction.auctioneer, id: lot.auction.auctioneer.id.toString(), tenantId: lot.auction.auctioneer.tenantId.toString() } : null,
        auctionStages: (lot.auction.stages || []).map((stage: any) => ({
          ...stage,
          id: stage.id.toString(),
          auctionId: stage.auctionId.toString(),
          initialPrice: stage.initialPrice ? Number(stage.initialPrice) : null,
        })),
      } as any as Auction;

      // Perform necessary type conversions for related data
      const bids = lot.bids.map((b: any) => ({ 
        id: b.id.toString(), 
        amount: Number(b.amount),
        auctionId: b.auctionId.toString(),
        lotId: b.lotId.toString(),
        bidderId: b.bidderId.toString(),
        tenantId: b.tenantId.toString(),
      })) as any as BidInfo[];
      
      const questions = lot.questions.map((q: any) => ({ 
        ...q,
        id: q.id.toString(),
        lotId: q.lotId.toString(),
        auctionId: q.auctionId.toString(),
        userId: q.userId.toString(),
        answeredByUserId: q.answeredByUserId?.toString() ?? null,
      })) as any as LotQuestion[];
      
      const reviews = lot.reviews.map((r: any) => ({ 
        ...r,
        id: r.id.toString(),
        lotId: r.lotId.toString(),
        auctionId: r.auctionId.toString(),
        userId: r.userId.toString(),
      })) as any as Review[];

      // Fallback e normalização adicionais para a V2
      const lotOut: Lot = {
        ...mappedLot,
        evaluationValue: (
          mappedLot?.evaluationValue ??
          ((Array.isArray((mappedLot as any).assets) && (mappedLot as any).assets.length > 0)
            ? Number((mappedLot as any).assets[0]?.evaluationValue ?? 0) || null
            : mappedLot?.evaluationValue ?? null)
        ),
      };

      return {
        lot: lotOut,
        auction: mappedAuction,
        seller: lot.auction.seller ? { 
          ...lot.auction.seller, 
          id: lot.auction.seller.id.toString(), 
          tenantId: lot.auction.seller.tenantId.toString(),
          userId: lot.auction.seller.userId?.toString() ?? null,
        } as any as SellerProfileInfo : null,
        auctioneer: lot.auction.auctioneer ? { 
          ...lot.auction.auctioneer, 
          id: lot.auction.auctioneer.id.toString(), 
          tenantId: lot.auction.auctioneer.tenantId.toString(),
          userId: lot.auction.auctioneer.userId?.toString() ?? null,
        } as any as AuctioneerProfileInfo : null,
        bids,
        questions,
        reviews,
      };
    } catch (error) {
      console.error(`Error fetching detailed data for lot V2 (ID: ${lotId}):`, error);
      return null;
    }
  }

  async getLots(auctionId?: string, tenantId?: string, limit?: number, isPublicCall = false): Promise<Lot[]> {
    const where: Prisma.LotWhereInput = {};
    if (auctionId) {
      where.auctionId = BigInt(auctionId);
    }
    
    const lotsFromRepo = await this.repository.findAll(tenantId, where, limit);

    const lots = lotsFromRepo.map((lot: any) => this.mapLotWithDetails(lot));

    if (isPublicCall) {
        return lots.filter((lot: any) => 
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
      return lots.filter((lot: any) => 
        lot &&
        !NON_PUBLIC_LOT_STATUSES.includes(lot.status) &&
        lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status)
      ).map((lot: any) => this.mapLotWithDetails(lot));
    }
    return lots.map((lot: any) => this.mapLotWithDetails(lot));
  }

  async findLotById(id: string, tenantId?: string): Promise<Lot | null> {
    console.log(`[LotService.findLotById] Searching for ID: ${id}, Tenant: ${tenantId}`);
    if (!id) return null;
  
    const whereClause: Prisma.LotWhereInput = {
        OR: [
            { publicId: id },
            { slug: id },
        ],
    };
  
    if (/^\d+$/.test(id)) {
        (whereClause.OR as any[]).push({ id: BigInt(id) });
    }

    if (tenantId) {
        (whereClause as any).tenantId = BigInt(tenantId);
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
    
    console.log(`[LotService.findLotById] Found lot: ${!!lot}`);
    if (lot) console.log(`[LotService.findLotById] Lot Tenant: ${lot.tenantId}, Status: ${lot.status}`);

    if (!lot) return null;

    if (tenantId && lot.tenantId.toString() !== String(tenantId)) {
        console.warn(`[LotService.findLotById] Tenant mismatch. Expected: ${tenantId}, Found: ${lot.tenantId}`);
        return null;
    }
    
    return this.mapLotWithDetails(lot);
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
      const lot = await this.repository.findById(lotId);
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

      const auction = await this.auctionRepository.findById(lot.tenantId.toString(), lot.auctionId.toString());
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
                tenantId: BigInt(cleanData.tenantId || 1) // Fallback tenantId if not provided
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

  async finalizeLot(lotId: string, winnerId: string, winningBidId: string): Promise<void> {
    try {
      await this.prisma.lot.update({
        where: { id: BigInt(lotId) },
        data: {
          status: 'ARREMATADO',
          winnerId: BigInt(winnerId),
          winningBidId: BigInt(winningBidId),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Erro ao finalizar lote:', error);
      throw error;
    }
  }
}

export const lotService = new LotService();