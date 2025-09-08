// packages/core/src/services/seller.service.ts
import { SellerRepository } from '../repositories/seller.repository';
import { AuctionRepository } from '../repositories/auction.repository';
import { LotService } from './lot.service';
import type { SellerFormData, SellerProfileInfo, Lot, SellerDashboardData } from '../types';
import { slugify } from '../lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserWinService } from './user-win.service';
import { CheckoutService } from './checkout.service';

export class SellerService {
  private sellerRepository: SellerRepository;
  private lotService: LotService;
  private userWinService: UserWinService;
  private checkoutService: CheckoutService;
  private auctionRepository: AuctionRepository;

  constructor() {
    this.sellerRepository = new SellerRepository();
    this.lotService = new LotService();
    this.userWinService = new UserWinService();
    this.checkoutService = new CheckoutService();
    this.auctionRepository = new AuctionRepository();
  }

  async obterComitentes(): Promise<SellerProfileInfo[]> {
    return this.sellerRepository.findAll();
  }

  async obterComitentePorId(id: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findById(id);
  }
  
  async findByName(name: string): Promise<SellerProfileInfo | null> {
    return this.sellerRepository.findByName(name);
  }

  async obterComitentePorSlug(slugOrId: string): Promise<SellerProfileInfo | null> {
      return this.sellerRepository.findBySlug(slugOrId);
  }
  
  async obterLotesPorComitenteSlug(sellerSlugOrId: string): Promise<Lot[]> {
      const seller = await this.sellerRepository.findBySlug(sellerSlugOrId);
      if (!seller) return [];
      return this.lotService.getLotsForConsignor(seller.id);
  }
  
  async getAuctionsBySellerSlug(sellerSlugOrId: string): Promise<any[]> {
    return this.auctionRepository.findBySellerSlug(sellerSlugOrId);
  }

  async criarComitente(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
      const existingSeller = await this.findByName(data.name);
      if (existingSeller) {
        return { success: false, message: 'Já existe um comitente com este nome.' };
      }

      const { userId, ...sellerData } = data;

      const dataToCreate: Prisma.SellerCreateInput = {
        ...sellerData,
        slug: slugify(data.name),
        publicId: `COM-${uuidv4()}`,
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

  async atualizarComitente(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataWithSlug = data.name ? { ...data, slug: slugify(data.name) } : data;
      await this.sellerRepository.update(id, dataWithSlug);
      return { success: true, message: 'Comitente atualizado com sucesso.' };
    } catch (error: any) {
       console.error(`Error in SellerService.updateSeller for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
  }
  
  async deletarComitente(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const lots = await this.lotService.getLotsForConsignor(id);
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
    const [sellerData, sellerWins] = await Promise.all([
        this.sellerRepository.findById(sellerId),
        this.userWinService.getWinsForConsignor(sellerId)
    ]);

    if (!sellerData) return null;

    const commissionRate = await this.checkoutService.getCommissionRate();

    const paidWins = sellerWins.filter(win => win.paymentStatus === 'PAGO');
    const totalRevenue = paidWins.reduce((acc, win) => acc + win.winningBidAmount, 0);
    const totalCommission = totalRevenue * commissionRate;
    const netValue = totalRevenue - totalCommission;

    const lotsSoldCount = sellerWins.length;
    const averageTicket = lotsSoldCount > 0 ? totalRevenue / lotsSoldCount : 0;
    
    // @ts-ignore
    const totalLots = await prisma.lot.count({ where: { sellerId }});
    const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;
    
    // @ts-ignore
    const totalAuctions = await prisma.auction.count({ where: { sellerId }});

    const salesByMonthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM/yy', { locale: ptBR });
      salesByMonthMap.set(monthKey, 0);
    }

    paidWins.forEach(win => {
      // @ts-ignore
      const winDate = win.paymentDate ? new Date(win.paymentDate) : new Date(win.winDate);
      const monthKey = format(winDate, 'MMM/yy', { locale: ptBR });
      if (salesByMonthMap.has(monthKey)) {
        salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + win.winningBidAmount);
      }
    });
    
    const salesByMonth = Array.from(salesByMonthMap, ([name, Faturamento]) => ({ name, Faturamento }));

    return {
      totalRevenue,
      totalCommission,
      netValue,
      totalAuctions,
      totalLots,
      lotsSoldCount,
      paidCount: paidWins.length,
      salesRate,
      averageTicket,
      salesByMonth,
      platformCommissionPercentage: commissionRate * 100,
    };
  }
}
