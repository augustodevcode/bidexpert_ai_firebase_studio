// src/services/seller.service.ts
import { SellerRepository } from '@/repositories/seller.repository';
import type { SellerFormData, SellerProfileInfo, Lot, SellerDashboardData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma'; // Import prisma directly for complex queries
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlatformSettingsService } from './platform-settings.service';
import { UserWinService } from './user-win.service';

export class SellerService {
  private sellerRepository: SellerRepository;
  private settingsService: PlatformSettingsService;
  private userWinService: UserWinService;

  constructor() {
    this.sellerRepository = new SellerRepository();
    this.settingsService = new PlatformSettingsService();
    this.userWinService = new UserWinService();
  }

  async getSellers(): Promise<SellerProfileInfo[]> {
    return this.sellerRepository.findAll();
  }

  async getSellerById(id: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findById(id);
  }
  
  async findByName(name: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findByName(name);
  }

  async getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
      return this.sellerRepository.findBySlug(slugOrId);
  }
  
  async getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
      const seller = await this.sellerRepository.findBySlug(sellerSlugOrId);
      if (!seller) return [];
      return this.sellerRepository.findLotsBySellerId(seller.id);
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
      const existingSeller = await this.sellerRepository.findByName(data.name);
      if (existingSeller) {
        return { success: false, message: 'Já existe um comitente com este nome.' };
      }

      const { userId, ...sellerData } = data;

      // Prepare the data for creation, generating the required fields.
      const dataToCreate: Prisma.SellerCreateInput = {
        ...sellerData,
        slug: slugify(data.name),
        publicId: `COM-${uuidv4()}`,
      };
      
      // If a userId is provided, create the connection.
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

  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.sellerRepository.update(id, dataWithSlug);
      return { success: true, message: 'Comitente atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lots = await this.sellerRepository.findLotsBySellerId(id);
      if (lots.length > 0) {
        return { success: false, message: `Não é possível excluir. O comitente está vinculado a ${lots.length} lote(s).` };
      }
      await this.sellerRepository.delete(id);
      return { success: true, message: 'Comitente excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in SellerService.deleteSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir comitente: ${error.message}` };
    }
  }
  
  async getSellerDashboardData(sellerId: string): Promise<SellerDashboardData | null> {
    const [sellerData, platformSettings, sellerWins] = await Promise.all([
        prisma.seller.findUnique({
            where: { id: sellerId },
            include: {
                _count: { select: { auctions: true, lots: true } },
            },
        }),
        this.settingsService.getSettings(),
        this.userWinService.getWinsForConsignor(sellerId)
    ]);

    if (!sellerData) return null;

    const paidWins = sellerWins.filter(win => win.paymentStatus === 'PAGO');
    const totalRevenue = paidWins.reduce((acc, win) => acc + win.winningBidAmount, 0);
    const commissionRate = (platformSettings.paymentGatewaySettings?.platformCommissionPercentage || 5) / 100;
    const totalCommission = totalRevenue * commissionRate;
    const netValue = totalRevenue - totalCommission;

    const lotsSoldCount = sellerWins.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    const salesRate = sellerData._count.lots > 0 ? (lotsSoldCount / sellerData._count.lots) * 100 : 0;

    const salesByMonthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM/yy', { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }

    paidWins.forEach(win => {
      const monthKey = format(new Date(win.winDate), 'MMM/yy', { locale: ptBR });
      if (salesByMonthMap.has(monthKey)) {
        salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + win.winningBidAmount);
      }
    });
    
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));

    return {
      totalRevenue,
      totalCommission,
      netValue,
      totalAuctions: sellerData._count.auctions,
      totalLots: sellerData._count.lots,
      lotsSoldCount,
      paidCount: paidWins.length,
      salesRate,
      averageTicket,
      salesByMonth,
      platformCommissionPercentage: commissionRate * 100,
    };
  }
}
