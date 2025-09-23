// src/services/seller.service.ts
import { SellerRepository } from '@/repositories/seller.repository';
import { AuctionRepository } from '@/repositories/auction.repository'; // Importar
import type { SellerFormData, SellerProfileInfo, Lot, Auction } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaInstance } from '@/lib/prisma'; // Import the instance getter
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone'; // Import timezone functions

export interface SellerDashboardData {
  totalRevenue: number;
  totalAuctions: number;
  totalLots: number;
  lotsSoldCount: number;
  salesRate: number;
  averageTicket: number;
  salesByMonth: { name: string; Faturamento: number }[];
}

const NON_PUBLIC_STATUSES: Prisma.AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];

export class SellerService {
  private sellerRepository: SellerRepository;
  private auctionRepository: AuctionRepository; // Adicionar
  private prisma;

  constructor() {
    this.sellerRepository = new SellerRepository();
    this.auctionRepository = new AuctionRepository(); // Instanciar
    this.prisma = getPrismaInstance();
  }
  
  private mapAuctionsWithDetails(auctions: any[]): Auction[] {
    return auctions.map(a => ({
      ...a,
      initialOffer: a.initialOffer ? Number(a.initialOffer) : undefined,
      totalLots: a._count?.lots ?? a.lots?.length ?? 0,
      seller: a.seller,
    }));
  }

  async getSellers(tenantId: string, limit?: number): Promise<SellerProfileInfo[]> {
    return this.sellerRepository.findAll(tenantId, limit);
  }

  async getSellerById(tenantId: string, id: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findById(tenantId, id);
  }
  
  async findByName(tenantId: string, name: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findByName(tenantId, name);
  }

  async getSellerBySlug(tenantId: string, slugOrId: string): Promise<SellerProfileInfo | null> {
      return this.sellerRepository.findBySlug(tenantId, slugOrId);
  }
  
  async getLotsBySellerSlug(tenantId: string, sellerSlugOrId: string): Promise<Lot[]> {
      const seller = await this.sellerRepository.findBySlug(tenantId, sellerSlugOrId);
      if (!seller) return [];
      return this.sellerRepository.findLotsBySellerId(tenantId, seller.id);
  }

  async getAuctionsBySellerSlug(tenantId: string, sellerSlugOrPublicId: string): Promise<Auction[]> {
    const auctions = await this.auctionRepository.findBySellerSlug(tenantId, sellerSlugOrPublicId);
    const publicAuctions = auctions.filter(a => !NON_PUBLIC_STATUSES.includes(a.status));
    return this.mapAuctionsWithDetails(publicAuctions);
  }

  async createSeller(tenantId: string, data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
      const existingSeller = await this.sellerRepository.findByName(tenantId, data.name);
      if (existingSeller) {
        return { success: false, message: 'Já existe um comitente com este nome.' };
      }

      const { userId, ...sellerData } = data;

      const dataToCreate: Prisma.SellerCreateInput = {
        ...(sellerData as any),
        slug: slugify(data.name),
        publicId: `COM-${uuidv4()}`,
        tenant: { connect: { id: tenantId } },
      };
      
      if (userId) {
        dataToCreate.user = { connect: { id: userId } };
      }
      
      const newSeller = await this.sellerRepository.create(dataToCreate);
      return { success: true, message: 'Comitente criado com sucesso.', sellerId: newSeller.id };
    } catch (error: any) {
      console.error("Error in SellerService.createSeller:", error);
      return { success: false, message: `Falha ao criar comitente: ${error.message}` };
    }
  }

  async updateSeller(tenantId: string, id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.sellerRepository.update(tenantId, id, dataWithSlug);
      return { success: true, message: 'Comitente atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  
  async deleteSeller(tenantId: string, id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lots = await this.sellerRepository.findLotsBySellerId(tenantId, id);
      if (lots.length > 0) {
        return { success: false, message: `Não é possível excluir. O comitente está vinculado a ${lots.length} lote(s).` };
      }
      await this.sellerRepository.delete(tenantId, id);
      return { success: true, message: 'Comitente excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in SellerService.deleteSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
  }
  
  async getSellerDashboardData(tenantId: string, sellerId: string): Promise<SellerDashboardData | null> {
    const sellerData = await this.prisma.seller.findFirst({
      where: { id: sellerId, tenantId },
      include: {
        _count: {
          select: { auctions: true, lots: true },
        },
        lots: {
          where: { status: 'VENDIDO', tenantId },
          select: { price: true, updatedAt: true }
        },
      },
    });

    if (!sellerData) return null;

    const totalRevenue = sellerData.lots.reduce((acc, lot) => acc + (lot.price ? Number(lot.price) : 0), 0);
    const lotsSoldCount = sellerData.lots.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    const salesRate = sellerData._count.lots > 0 ? (lotsSoldCount / sellerData._count.lots) * 100 : 0;

    const salesByMonthMap = new Map<string, number>();
    const now = nowInSaoPaulo(); // Use timezone-aware function
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM/yy', { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }

    sellerData.lots.forEach(lot => {
      const monthKey = formatInSaoPaulo(lot.updatedAt, 'MMM/yy'); // Use timezone-aware function
      if (salesByMonthMap.has(monthKey)) {
        salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price ? Number(lot.price) : 0));
      }
    });
    
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));

    return {
      totalRevenue,
      totalAuctions: sellerData._count.auctions,
      totalLots: sellerData._count.lots,
      lotsSoldCount,
      salesRate,
      averageTicket,
      salesByMonth,
    };
  }
}
