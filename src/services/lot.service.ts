// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import { AuctionRepository } from '@/repositories/auction.repository';
import type { Lot, LotFormData, BidInfo, UserLotMaxBid, Review, LotQuestion, LotStatus } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, Prisma } from '@prisma/client';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';
import { AssetService } from './asset.service';

// Inicializa o cliente Prisma
const prisma = new PrismaClient();

const NON_PUBLIC_STATUSES: LotStatus[] = ['RASCUNHO', 'CANCELADO'];

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
    const assets = lot.assets?.map((la: any) => la.asset).filter(Boolean) || [];
    return {
      ...lot,
      id: lot.id?.toString(),
      auctionId: lot.auctionId?.toString(),
      categoryId: lot.categoryId?.toString(),
      subcategoryId: lot.subcategoryId?.toString(),
      sellerId: lot.sellerId?.toString(),
      tenantId: lot.tenantId?.toString(),
      price: lot.price ? new Prisma.Decimal(lot.price) : new Prisma.Decimal(0),
      initialPrice: lot.initialPrice ? new Prisma.Decimal(lot.initialPrice) : null,
      secondInitialPrice: lot.secondInitialPrice ? new Prisma.Decimal(lot.secondInitialPrice) : null,
      bidIncrementStep: lot.bidIncrementStep ? new Prisma.Decimal(lot.bidIncrementStep) : null,
      latitude: lot.latitude ? Number(lot.latitude) : null,
      longitude: lot.longitude ? Number(lot.longitude) : null,
      evaluationValue: lot.evaluationValue ? new Prisma.Decimal(lot.evaluationValue) : null,
      currentBidAmount: lot.currentBidAmount ? new Prisma.Decimal(lot.currentBidAmount) : null,
      assets: assets,
      assetIds: assets.map((a: any) => a.id.toString()),
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
      sellerName: lot.seller?.name,
      winningBidId: lot.winningBidId?.toString(),
      winningBidderId: lot.winningBidderId?.toString(),
      winnerId: lot.winnerId?.toString(),
    } as Lot;
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
    const idsAsBigInt = ids.map(id => BigInt(id));
    const lots = await this.repository.findByIds(idsAsBigInt);
    if (isPublicCall) {
      // Garante que mesmo buscando por ID, os status não públicos e de leilões não publicados sejam respeitados
      return lots.filter(lot => 
        !NON_PUBLIC_STATUSES.includes(lot.status) &&
        lot.auction && !['RASCUNHO', 'EM_PREPARACAO'].includes(lot.auction.status)
      ).map(lot => this.mapLotWithDetails(lot));
    }
    return lots.map(lot => this.mapLotWithDetails(lot));
  }

  async findLotById(id: string): Promise<Lot | null> {
    if (!id) return null;
    
    // If it's a numeric ID, convert to BigInt
    if (/^\d+$/.test(id)) {
      return this.repository.findById(id);
    }
    
    // Otherwise, it's a public ID, search by publicId
    const lot = await this.prisma.lot.findFirst({
      where: { publicId: id },
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
      const isLotPublic = !NON_PUBLIC_STATUSES.includes(lot.status);
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

  async getLotBids(lotId: string): Promise<BidInfo[]> {
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
        amount: new Prisma.Decimal(bid.amount),
        timestamp: bid.timestamp,
        bidderDisplay: bid.bidderDisplay
      } as unknown as BidInfo));
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
      if (lot.status !== 'ATIVO') {
        return { success: false, message: 'Este lote não está mais disponível para lances.' };
      }

      // Verificar se o lance é maior que o lance atual
      if (lot.currentBidAmount && amount <= Number(lot.currentBidAmount)) {
        return { 
          success: false, 
          message: `O lance deve ser maior que o valor atual de ${lot.currentBidAmount}.` 
        };
      }

      // Verificar se o leilão ainda está ativo
      const auction = await this.auctionRepository.findById(lot.auctionId.toString(), lot.tenantId);
      if (!auction || auction.status !== 'EM_ANDAMENTO') {
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

  async updateLot(id: string, data: Partial<LotFormData>, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Converter strings para BigInt onde necessário
      const lotId = BigInt(id);
      
      // Preparar dados para atualização, convertendo IDs de string para BigInt se necessário
      const { 
        auctionId, 
        categoryId, 
        subcategoryId, 
        sellerId, 
        assetIds = [],
        ...cleanData 
      } = data as any;
      
      // Atualizar relacionamentos se necessário
      const updateRelations: Record<string, any> = {};
      
      if (categoryId) {
        updateRelations.category = { connect: { id: BigInt(categoryId) } };
      }
      
      if (subcategoryId) {
        updateRelations.subcategory = { connect: { id: BigInt(subcategoryId) } };
      }
      
      if (sellerId) {
        updateRelations.seller = { connect: { id: BigInt(sellerId) } };
      }
      
      // Atualizar o lote
      await this.prisma.$transaction(async (tx) => {
        // 1. Atualizar dados básicos do lote
        await tx.lot.update({
          where: { id: lotId },
          data: {
            ...cleanData,
            ...updateRelations,
            updatedAt: new Date(),
            updatedBy: userId
          } as Prisma.LotUpdateInput
        });
        
        // 2. Atualizar associações de ativos, se fornecidas
        if (Array.isArray(assetIds)) {
          const assetIdsBigInt = assetIds
            .filter((id): id is string => Boolean(id))
            .map(id => BigInt(id));
          
          // Remover associações existentes
          await tx.assetsOnLots.deleteMany({
            where: { lotId }
          });
          
          // Criar novas associações, se houver
          if (assetIdsBigInt.length > 0) {
            await tx.assetsOnLots.createMany({
              data: assetIdsBigInt.map(assetId => ({
                lotId,
                assetId,
                assignedBy: userId
              })),
              skipDuplicates: true
            });
            
            // Atualizar status dos ativos para 'LOTEADO'
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

  async deleteLot(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const lotId = BigInt(id);
      
      // Usar transação para garantir consistência
      await this.prisma.$transaction(async (tx) => {
        // 1. Obter os IDs dos ativos associados
        const assetsOnLots = await tx.assetsOnLots.findMany({
          where: { lotId },
          select: { assetId: true }
        });
        
        const assetIds = assetsOnLots.map(a => a.assetId);
        
        // 2. Excluir associações de ativos
        await tx.assetsOnLots.deleteMany({
          where: { lotId }
        });
        
        // 3. Excluir o lote
        await tx.lot.delete({
          where: { id: lotId }
        });
        
        // 4. Atualizar status dos ativos para DISPONIVEL
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
  
  async finalizeLot(lotId: string, sold: boolean, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar se o lote existe
      const lot = await this.repository.findById(lotId);
      if (!lot) {
        return { success: false, message: 'Lote não encontrado.' };
      }

      // Usar transação para garantir consistência
      await this.prisma.$transaction(async (tx) => {
        // 1. Encontrar o lance vencedor se o lote foi vendido
        let winningBid = null;
        if (sold) {
          winningBid = await tx.bid.findFirst({
            where: { lotId: BigInt(lotId) },
            orderBy: { amount: 'desc' },
            select: {
              id: true,
              amount: true,
              bidderId: true,
              bidderDisplay: true
            }
          });

          if (!winningBid) {
            throw new Error('Nenhum lance encontrado para este lote.');
          }
        }

        // 2. Atualizar o lote
        const updateData: Prisma.LotUpdateInput = {
          status: sold ? 'VENDIDO' : 'NAO_VENDIDO',
          updatedAt: new Date()
        };

        // Se vendido, atualizar informações do vencedor
        if (sold && winningBid) {
          updateData.winner = { connect: { id: winningBid.bidderId } };
          updateData.price = winningBid.amount;
          // Atualizar contador de lances
          updateData.bidsCount = { increment: 1 };
          
          // Criar registro de vitória
          await tx.userWin.create({
            data: {
              lot: { connect: { id: BigInt(lotId) } },
              user: { connect: { id: winningBid.bidderId } },
              winningBidAmount: winningBid.amount,
              winDate: new Date(),
              paymentStatus: 'PENDENTE',
              retrievalStatus: 'PENDENTE'
            }
          });
        }
        
        await tx.lot.update({
          where: { id: BigInt(lotId) },
          data: updateData,
          select: {
            id: true,
            status: true,
            updatedAt: true,
            price: true
          }
        });

        // 3. Obter os ativos associados ao lote
        const assetsOnLots = await tx.assetsOnLots.findMany({
          where: { lotId: BigInt(lotId) },
          select: { assetId: true }
        });

        // 4. Atualizar status dos ativos
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

        // 5. Se vendido, criar registro de vencedor
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
}