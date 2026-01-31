/**
 * @fileoverview Domain service orchestrating tenant-safe Lot operations and projections.
 * 
 * REGRAS DE CONSISTÊNCIA DE ESTADO:
 * - Lotes só podem ser abertos (ABERTO_PARA_LANCES) se:
 *   1. Possuem pelo menos 1 Ativo vinculado
 *   2. O Leilão pai está em status compatível (ABERTO ou ABERTO_PARA_LANCES)
 *   3. Todos os dados obrigatórios estão preenchidos (título, preço inicial, etc.)
 * 
 * - Ao vincular/desvincular Ativos:
 *   1. Atualiza automaticamente o status do Ativo para LOTEADO ou DISPONIVEL
 * 
 * - Ao encerrar um Leilão:
 *   1. Todos os Lotes abertos devem ser encerrados automaticamente
 */
import { PrismaClient, Lot as PmLot, Auction as PmAuction, Bid, LotStatus, AuctionStatus, AssetStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generatePublicId } from '@/lib/public-id-generator';
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

// Status de Leilão que permitem abertura de Lotes
const AUCTION_ALLOWS_LOT_OPENING: AuctionStatus[] = ['ABERTO', 'ABERTO_PARA_LANCES'];

// Status de Leilão que permitem modificações nos Lotes
const AUCTION_EDITABLE_STATUSES: AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE'];

// Status de Lote que requerem validação completa de integridade
const LOT_STATUSES_REQUIRING_INTEGRITY: LotStatus[] = ['EM_BREVE', 'ABERTO_PARA_LANCES'];

// Resultado da validação de integridade do Lote
export interface LotIntegrityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

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

  /**
   * Valida a integridade de um Lote para verificar se pode ser aberto/publicado.
   * Regras verificadas:
   * 1. Possui pelo menos 1 Ativo vinculado
   * 2. Possui título preenchido
   * 3. Possui preço inicial válido (> 0)
   * 4. O Leilão pai está em status compatível
   */
  async validateLotIntegrity(lotId: string): Promise<LotIntegrityValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const internalId = await this.resolveLotInternalId(lotId);
      
      const lot = await this.prisma.lot.findUnique({
        where: { id: internalId },
        include: {
          auction: { select: { id: true, status: true, title: true } },
          assets: { select: { assetId: true } }
        }
      });

      if (!lot) {
        return { isValid: false, errors: ['Lote não encontrado'], warnings: [] };
      }

      // 1. Verificar Ativos vinculados
      if (!lot.assets || lot.assets.length === 0) {
        errors.push('Lote deve possuir pelo menos 1 Ativo vinculado para ser aberto');
      }

      // 2. Verificar título
      if (!lot.title || lot.title.trim() === '') {
        errors.push('Lote deve possuir título preenchido');
      }

      // 3. Verificar preço inicial
      const initialPrice = lot.initialPrice ? Number(lot.initialPrice) : 0;
      const price = lot.price ? Number(lot.price) : 0;
      if (initialPrice <= 0 && price <= 0) {
        errors.push('Lote deve possuir preço inicial válido (maior que zero)');
      }

      // 4. Verificar status do Leilão pai
      if (!lot.auction) {
        errors.push('Lote deve estar vinculado a um Leilão');
      } else if (!AUCTION_ALLOWS_LOT_OPENING.includes(lot.auction.status as AuctionStatus)) {
        errors.push(`Leilão "${lot.auction.title}" está em status ${lot.auction.status}. Lotes só podem ser abertos quando o Leilão está ABERTO ou ABERTO_PARA_LANCES`);
      }

      // Warnings (não bloqueantes)
      if (!lot.description || lot.description.trim() === '') {
        warnings.push('Recomenda-se preencher a descrição do Lote');
      }

      if (!lot.imageUrl) {
        warnings.push('Recomenda-se adicionar uma imagem ao Lote');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Erro ao validar integridade do Lote:', error);
      return { isValid: false, errors: ['Erro interno ao validar Lote'], warnings: [] };
    }
  }

  /**
   * Verifica se o Leilão permite modificações em seus Lotes.
   */
  async canModifyLot(lotId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const internalId = await this.resolveLotInternalId(lotId);
      
      const lot = await this.prisma.lot.findUnique({
        where: { id: internalId },
        include: {
          auction: { select: { status: true, title: true } }
        }
      });

      if (!lot) {
        return { allowed: false, reason: 'Lote não encontrado' };
      }

      // Lotes podem ser modificados se o Leilão está em fase de preparação
      if (AUCTION_EDITABLE_STATUSES.includes(lot.auction.status as AuctionStatus)) {
        return { allowed: true };
      }

      // Se o Leilão já está aberto, apenas Lotes em RASCUNHO podem ser editados
      if (lot.status === 'RASCUNHO') {
        return { allowed: true };
      }

      return { 
        allowed: false, 
        reason: `Não é possível modificar este Lote. O Leilão "${lot.auction.title}" está em status ${lot.auction.status} e o Lote está em ${lot.status}`
      };
    } catch (error) {
      return { allowed: false, reason: 'Erro ao verificar permissões' };
    }
  }

  /**
   * Atualiza o status de um Lote com validação de integridade.
   * Esta função garante que transições de estado inválidas sejam bloqueadas.
   */
  async updateLotStatus(lotId: string, newStatus: LotStatus): Promise<{ success: boolean; message: string }> {
    try {
      const internalId = await this.resolveLotInternalId(lotId);
      
      // Se o novo status requer integridade completa, validar primeiro
      if (LOT_STATUSES_REQUIRING_INTEGRITY.includes(newStatus)) {
        const validation = await this.validateLotIntegrity(lotId);
        if (!validation.isValid) {
          return { 
            success: false, 
            message: `Não é possível alterar status para ${newStatus}. Erros: ${validation.errors.join('; ')}`
          };
        }
      }

      await this.prisma.lot.update({
        where: { id: internalId },
        data: { status: newStatus, updatedAt: new Date() }
      });

      return { success: true, message: `Status do Lote atualizado para ${newStatus}` };
    } catch (error) {
      console.error('Erro ao atualizar status do Lote:', error);
      return { success: false, message: 'Erro ao atualizar status do Lote' };
    }
  }

  /**
   * Vincula Ativos a um Lote e atualiza automaticamente o status dos Ativos para LOTEADO.
   */
  async linkAssetsToLot(lotId: string, assetIds: string[], tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const internalLotId = await this.resolveLotInternalId(lotId);
      
      // Verificar se pode modificar o Lote
      const canModify = await this.canModifyLot(lotId);
      if (!canModify.allowed) {
        return { success: false, message: canModify.reason || 'Não é possível modificar este Lote' };
      }

      await this.prisma.$transaction(async (tx) => {
        // Vincular Ativos ao Lote
        await tx.assetsOnLots.createMany({
          data: assetIds.map(assetId => ({
            lotId: internalLotId,
            assetId: BigInt(assetId),
            tenantId: BigInt(tenantId),
            assignedBy: 'SYSTEM'
          })),
          skipDuplicates: true
        });

        // Atualizar status dos Ativos para LOTEADO
        await tx.asset.updateMany({
          where: { id: { in: assetIds.map(id => BigInt(id)) } },
          data: { status: 'LOTEADO', updatedAt: new Date() }
        });
      });

      return { success: true, message: `${assetIds.length} Ativo(s) vinculado(s) ao Lote` };
    } catch (error) {
      console.error('Erro ao vincular Ativos ao Lote:', error);
      return { success: false, message: 'Erro ao vincular Ativos ao Lote' };
    }
  }

  /**
   * Remove Ativos de um Lote e reverte o status dos Ativos para DISPONIVEL
   * (somente se não estiverem vinculados a outros Lotes).
   */
  async unlinkAssetsFromLot(lotId: string, assetIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const internalLotId = await this.resolveLotInternalId(lotId);
      
      // Verificar se pode modificar o Lote
      const canModify = await this.canModifyLot(lotId);
      if (!canModify.allowed) {
        return { success: false, message: canModify.reason || 'Não é possível modificar este Lote' };
      }

      await this.prisma.$transaction(async (tx) => {
        // Remover vínculos
        await tx.assetsOnLots.deleteMany({
          where: {
            lotId: internalLotId,
            assetId: { in: assetIds.map(id => BigInt(id)) }
          }
        });

        // Para cada Ativo, verificar se ainda está em outro Lote
        for (const assetId of assetIds) {
          const otherLinks = await tx.assetsOnLots.count({
            where: { assetId: BigInt(assetId) }
          });

          // Se não está mais em nenhum Lote, reverter para DISPONIVEL
          if (otherLinks === 0) {
            await tx.asset.update({
              where: { id: BigInt(assetId) },
              data: { status: 'DISPONIVEL', updatedAt: new Date() }
            });
          }
        }
      });

      return { success: true, message: `${assetIds.length} Ativo(s) removido(s) do Lote` };
    } catch (error) {
      console.error('Erro ao remover Ativos do Lote:', error);
      return { success: false, message: 'Erro ao remover Ativos do Lote' };
    }
  }

  private async resolveLotInternalId(idOrPublicId: string): Promise<bigint> {
    if (/^\d+$/.test(idOrPublicId)) {
      return BigInt(idOrPublicId);
    }

    const lotRecord = await this.prisma.lot.findUnique({
      where: { publicId: idOrPublicId },
      select: { id: true }
    });

    if (!lotRecord) {
      throw new Error(`Lot not found for identifier ${idOrPublicId}`);
    }

    return lotRecord.id;
  }

  private mapLotWithDetails(lot: any): Lot {
    const primaryProcess = lot.judicialProcesses?.[0];
    return {
      ...lot,
      id: lot.id.toString(),
      bidsCount: lot._count?.bids ?? lot.bidsCount ?? 0,
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
      judicialProcesses: lot.judicialProcesses?.map((jp: any) => ({
        ...jp,
        id: jp.id.toString(),
        tenantId: jp.tenantId.toString(),
        courtId: jp.courtId?.toString(),
        districtId: jp.districtId?.toString(),
        branchId: jp.branchId?.toString(),
        sellerId: jp.sellerId?.toString(),
      })),
      lotRisks: lot.lotRisks?.map((risk: any) => ({
        ...risk,
        id: risk.id.toString(),
        lotId: risk.lotId.toString(),
        tenantId: risk.tenantId.toString(),
        verifiedBy: risk.verifiedBy?.toString() || null,
      })),
      assets: lot.assets?.map((a: any) => ({
          ...a.asset,
          id: a.asset.id.toString(),
          tenantId: a.asset.tenantId.toString()
      })),
      documents: lot.documents?.map((d: any) => ({
          ...d,
          id: d.id.toString(),
          lotId: d.lotId.toString(),
          tenantId: d.tenantId.toString()
      })),
      propertyMatricula: primaryProcess?.propertyMatricula || null,
      propertyRegistrationNumber: lot.propertyRegistrationNumber || primaryProcess?.propertyRegistrationNumber || null,
      actionType: primaryProcess?.actionType || null,
      actionDescription: primaryProcess?.actionDescription || null,
      actionCnjCode: primaryProcess?.actionCnjCode || null,
      // UI Fields mapping
      totalArea: lot.assets?.reduce((acc: number, curr: any) => acc + (Number(curr.asset.totalArea) || 0), 0) || null,
      type: lot.type || (lot.assets?.[0]?.asset?.categoryId ? 'IMOVEL' : 'OUTRO'),
      occupancyStatus: lot.occupancyStatus || lot.assets?.[0]?.asset?.occupationStatus || null
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
                judicialProcesses: true,
                lotPrices: true,
                assets: {
                    include: {
                        asset: true
                    }
                },
                lotRisks: true,
                documents: {
                    orderBy: { displayOrder: 'asc' }
                },
                _count: {
                    select: { bids: true }
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

  async getLots(filter?: { auctionId?: string; judicialProcessId?: string }, tenantId?: string, limit?: number, isPublicCall = false): Promise<Lot[]> {
    try {
        const where: any = {};
        if (filter?.auctionId) where.auctionId = BigInt(filter.auctionId);
        if (filter?.judicialProcessId) where.judicialProcesses = { some: { id: BigInt(filter.judicialProcessId) } };
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
                judicialProcesses: true,
                lotPrices: true,
                assets: {
                    include: {
                        asset: true
                    }
                },
                lotRisks: true,
                documents: {
                    orderBy: { displayOrder: 'asc' }
                },
                _count: {
                    select: { bids: true }
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

  async getLotDocuments(lotId: string): Promise<any[]> {
      try {
          const documents = await this.prisma.lotDocument.findMany({
              where: { lotId: BigInt(lotId) },
              orderBy: { displayOrder: 'asc' }
          });
          return documents.map(d => ({
              ...d,
              id: d.id.toString(),
              lotId: d.lotId.toString(),
              tenantId: d.tenantId.toString()
          }));
      } catch (error) {
          console.error('Error fetching lot documents:', error);
          return [];
      }
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

  async placeBid(lotIdOrPublicId: string, userId: string, amount: number, bidderDisplay?: string): Promise<{ success: boolean; message: string; currentBid?: number }> {
    try {
      // Resolve publicId para o ID interno se necessário
      const internalLotId = await this.resolveLotInternalId(lotIdOrPublicId);
      
      const lot = await this.prisma.lot.findUnique({ where: { id: internalLotId } });
      if (!lot) {
        return { success: false, message: 'Lote não encontrado.' };
      }

      if (lot.status !== 'ABERTO_PARA_LANCES') {
        return { success: false, message: 'Este lote não está mais disponível para lances.' };
      }

      // Validar valor do lance
      // Se já houver lances, o novo lance DEVE ser maior que o valor atual (lot.price).
      // Se NÃO houver lances (bidsCount == 0), o lot.price pode estar com Valor de Avaliação ou outro valor inicial
      // que não necessariamente reflete o lance mínimo da praça atual (ex: 510k vs 720k).
      // Nesse caso, confiamos na validação do frontend/regra de negócio de praça e permitimos o primeiro lance.
      const hasBids = (lot.bidsCount ?? 0) > 0;

      if (hasBids && lot.price && amount <= Number(lot.price)) {
        return { 
          success: false, 
          message: `O lance deve ser maior que o valor atual de ${lot.price}.` 
        };
      }

      const auction = await this.prisma.auction.findUnique({ where: { id: lot.auctionId } });
      // Permite lances se o leilão está ABERTO ou ABERTO_PARA_LANCES
      const auctionAllowsBids = auction && (auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO');
      if (!auctionAllowsBids) {
        return { success: false, message: 'Este leilão não está mais ativo.' };
      }

      await this.prisma.$transaction(async (tx) => {
        const bid = await tx.bid.create({
          data: {
            lot: { connect: { id: internalLotId } },
            auction: { connect: { id: lot.auctionId } },
            bidder: { connect: { id: BigInt(userId) } },
            amount: new Prisma.Decimal(amount),
            bidderDisplay: bidderDisplay || null,
            tenant: { connect: { id: lot.tenantId } }
          },
          select: {
            id: true,
            amount: true,
            bidderId: true,
            bidderDisplay: true
          }
        });

        await tx.lot.update({
          where: { id: internalLotId },
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
        lotRisks = [],
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

      if (cleanData.categoryId) {
        createData.categoryId = BigInt(cleanData.categoryId);
        delete createData.category;
      }
      if (cleanData.subcategoryId) {
        createData.subcategoryId = BigInt(cleanData.subcategoryId);
        delete createData.subcategory;
      }
      if (cleanData.sellerId) {
        createData.sellerId = BigInt(cleanData.sellerId);
        delete createData.seller;
      }
      if (cleanData.auctioneerId) {
        createData.auctioneerId = BigInt(cleanData.auctioneerId);
        delete createData.auctioneer;
      }
      if (cleanData.cityId) {
        createData.cityId = BigInt(cleanData.cityId);
        delete createData.city;
      }
      if (cleanData.stateId) {
        createData.stateId = BigInt(cleanData.stateId);
        delete createData.state;
      }



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

        if (Array.isArray(lotRisks) && lotRisks.length > 0) {
          const prismaAny = this.prisma as unknown as Record<string, any>;
          const lotRiskModel = prismaAny['lotRisk'] ?? prismaAny['lotRisks'];
          await lotRiskModel.createMany({
          data: lotRisks.map((risk: any) => ({
            lotId,
            tenantId: BigInt(tenantId),
            riskType: risk.riskType,
            riskLevel: risk.riskLevel,
            riskDescription: risk.riskDescription,
            mitigationStrategy: risk.mitigationStrategy || null,
            verified: Boolean(risk.verified),
            verifiedAt: risk.verified ? new Date() : null,
          })),
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
                },
                _count: {
                    select: { bids: true }
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
      const lotId = await this.resolveLotInternalId(id);
      const lotRecord = await this.prisma.lot.findUnique({ where: { id: lotId }, select: { tenantId: true } });
      const tenantForLot = lotRecord?.tenantId ?? BigInt(data.tenantId || 1);
      
      const { 
        assetIds = [],
        auctionId,
        lotRisks,
        ...cleanData 
      } = data as any;
      
      const updateRelations: Record<string, any> = {};
      
      if (auctionId) {
        updateRelations.auction = { connect: { id: BigInt(auctionId) } };
      }
      
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
                tenantId: tenantForLot,
                assignedBy: 'SYSTEM'
              }))
            });
          }
        }

        if (lotRisks !== undefined) {
          const txAny = tx as unknown as Record<string, any>;
          const lotRiskModel = txAny['lotRisk'] ?? txAny['lotRisks'];
          await lotRiskModel.deleteMany({ where: { lotId } });
          if (Array.isArray(lotRisks) && lotRisks.length > 0) {
              await lotRiskModel.createMany({
              data: lotRisks.map((risk: any) => ({
                lotId,
                tenantId: tenantForLot,
                riskType: risk.riskType,
                riskLevel: risk.riskLevel,
                riskDescription: risk.riskDescription,
                mitigationStrategy: risk.mitigationStrategy || null,
                verified: Boolean(risk.verified),
                verifiedAt: risk.verified ? new Date() : null,
              })),
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

      const lot = await this.prisma.lot.findUnique({ where: { id: numericLotId }, select: { tenantId: true } });
      if (!lot) {
        return { success: false, message: 'Lote não encontrado' };
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
          isActive: true,
          tenantId: lot.tenantId,
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
    comment: string,
    tenantId: string
  ): Promise<{ success: boolean; message: string; reviewId?: string }> {
    try {
      let numericLotId: string;
      
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = lotIdOrPublicId;
        const lot = await this.prisma.lot.findUnique({ where: { id: BigInt(lotIdOrPublicId) } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
        numericLotId = lot.id.toString();
      }

      const review = await this.reviewService.create({
        lotId: numericLotId,
        userId,
        authorName: userDisplayName,
        rating,
        comment,
        tenantId
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
    questionText: string,
    tenantId: string
  ): Promise<{ success: boolean; message: string; questionId?: string }> {
    try {
      let numericLotId: bigint;
      
      if (/^\d+$/.test(lotIdOrPublicId)) {
        numericLotId = BigInt(lotIdOrPublicId);
        const lot = await this.prisma.lot.findUnique({ where: { id: numericLotId } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
      } else {
        const lot = await this.prisma.lot.findUnique({ where: { publicId: lotIdOrPublicId } });
        if (!lot) return { success: false, message: 'Lote não encontrado' };
        numericLotId = lot.id;
      }

      const question = await this.lotQuestionService.create({
        lotId: numericLotId.toString(),
        userId,
        authorName: userDisplayName,
        question: questionText,
        tenantId
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