// src/services/bidder.service.ts
/**
 * @fileoverview Service para gerenciar dados do painel do arrematante (bidder dashboard)
 * Centraliza toda a lógica de negócio relacionada ao bidder
 */

import { BidderRepository } from '@/repositories/bidder.repository';
import type {
  BidderProfile,
  WonLot,
  BidderNotification,
  PaymentMethod,
  ParticipationHistory,
  BidderDashboardOverview,
  UpdateBidderProfileRequest,
  ApiResponse
} from '@/types/bidder-dashboard';
import { Decimal } from '@prisma/client/runtime/library';

export class BidderService {
  private bidderRepository: BidderRepository;

  constructor() {
    this.bidderRepository = new BidderRepository();
  }

  /**
   * Obtém ou cria perfil do bidder para um usuário
   */
  async getOrCreateBidderProfile(userId: bigint): Promise<BidderProfile> {
    let profile = await this.bidderRepository.findByUserId(userId);

    if (!profile) {
      profile = await this.bidderRepository.create({
        user: { connect: { id: userId } },
        emailNotifications: true,
        smsNotifications: false,
        isActive: true
      });
    }

    return this.mapBidderProfile(profile);
  }

  /**
   * Atualiza perfil do bidder
   */
  async updateBidderProfile(
    userId: bigint,
    data: UpdateBidderProfileRequest
  ): Promise<ApiResponse<BidderProfile>> {
    try {
      const profile = await this.getOrCreateBidderProfile(userId);

      const updatedProfile = await this.bidderRepository.update(userId, {
        ...data,
        updatedAt: new Date()
      });

      return {
        success: true,
        data: this.mapBidderProfile(updatedProfile)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obtém overview do dashboard do bidder
   */
  async getBidderDashboardOverview(userId: bigint): Promise<BidderDashboardOverview> {
    const profile = await this.getOrCreateBidderProfile(userId);

    // Buscar lotes arrematados
    const wonLots = await this.bidderRepository.findWonLotsByBidderId(profile.id, {
      take: 5,
      orderBy: { wonAt: 'desc' }
    });

    // Buscar notificações recentes
    const recentNotifications = await this.bidderRepository.findNotificationsByBidderId(profile.id, {
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return {
      wonLotsCount: wonLots.length,
      totalSpent: wonLots.reduce((sum, lot) => sum.add(lot.finalBid), new Decimal(0)),
      pendingPayments: wonLots.filter(lot => lot.paymentStatus === 'PENDENTE').length,
      overduePayments: wonLots.filter(lot => lot.paymentStatus === 'ATRASADO').length,
      documentsPending: profile.documentStatus === 'PENDING' ? 1 : 0,
      unreadNotifications: recentNotifications.filter(n => !n.isRead).length,
      recentWonLots: wonLots.map(this.mapWonLot),
      recentNotifications: recentNotifications.map(this.mapBidderNotification),
      paymentSummary: {
        totalPending: wonLots
          .filter(lot => lot.paymentStatus === 'PENDENTE')
          .reduce((sum, lot) => sum.add(lot.totalAmount), new Decimal(0)),
        totalOverdue: new Decimal(0),
        nextDueDate: wonLots.find(lot => lot.dueDate)?.dueDate
      }
    };
  }

  /**
   * Obtém lotes arrematados do bidder
   */
  async getBidderWonLots(
    userId: bigint,
    options: {
      page?: number;
      limit?: number;
      filters?: any;
      sort?: any;
    } = {}
  ) {
    const profile = await this.getOrCreateBidderProfile(userId);
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where: any = { bidderId: profile.id };

    // Aplicar filtros
    if (options.filters?.status) {
      where.status = { in: options.filters.status };
    }
    if (options.filters?.paymentStatus) {
      where.paymentStatus = { in: options.filters.paymentStatus };
    }
    if (options.filters?.dateRange) {
      where.wonAt = {
        gte: options.filters.dateRange.from,
        lte: options.filters.dateRange.to
      };
    }
    if (options.filters?.search) {
      where.title = { contains: options.filters.search, mode: 'insensitive' };
    }

    // Aplicar ordenação
    const orderBy: any = options.sort?.field ? {
      [options.sort.field]: options.sort.direction
    } : { wonAt: 'desc' };

    const [wonLots, total] = await Promise.all([
      this.bidderRepository.findWonLotsByBidderId(profile.id, {
        skip,
        take: limit,
        where,
        orderBy
      }),
      this.bidderRepository.countWonLots(profile.id, where)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: wonLots.map(this.mapWonLot),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalWon: total,
        totalSpent: wonLots.reduce((sum, lot) => sum.add(lot.finalBid), new Decimal(0)),
        pendingPayments: wonLots.filter(lot => lot.paymentStatus === 'PENDENTE').length,
        paidLots: wonLots.filter(lot => lot.paymentStatus === 'PAGO').length
      }
    };
  }

  /**
   * Obtém métodos de pagamento do bidder
   */
  async getBidderPaymentMethods(userId: bigint) {
    const profile = await this.getOrCreateBidderProfile(userId);

    const methods = await this.bidderRepository.findPaymentMethodsByBidderId(profile.id);
    const defaultMethod = methods.find(m => m.isDefault);

    return {
      methods: methods.map(this.mapPaymentMethod),
      defaultMethod: defaultMethod ? this.mapPaymentMethod(defaultMethod) : null
    };
  }

  /**
   * Obtém notificações do bidder
   */
  async getBidderNotifications(
    userId: bigint,
    options: {
      page?: number;
      limit?: number;
      filters?: any;
      sort?: any;
    } = {}
  ) {
    const profile = await this.getOrCreateBidderProfile(userId);
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { bidderId: profile.id };

    if (options.filters?.type) {
      where.type = { in: options.filters.type };
    }
    if (options.filters?.isRead !== undefined) {
      where.isRead = options.filters.isRead;
    }
    if (options.filters?.dateRange) {
      where.createdAt = {
        gte: options.filters.dateRange.from,
        lte: options.filters.dateRange.to
      };
    }

    const orderBy: any = options.sort?.field ? {
      [options.sort.field]: options.sort.direction
    } : { createdAt: 'desc' };

    const [notifications, total] = await Promise.all([
      this.bidderRepository.findNotificationsByBidderId(profile.id, {
        skip,
        take: limit,
        where,
        orderBy
      }),
      this.bidderRepository.countNotifications(profile.id, where)
    ]);

    const unreadCount = await this.bidderRepository.countNotifications(profile.id, {
      bidderId: profile.id,
      isRead: false
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications.map(this.mapBidderNotification),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      unreadCount
    };
  }

  /**
   * Obtém histórico de participações do bidder
   */
  async getParticipationHistory(
    userId: bigint,
    options: {
      page?: number;
      limit?: number;
      filters?: any;
      sort?: any;
    } = {}
  ) {
    const profile = await this.getOrCreateBidderProfile(userId);
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { bidderId: profile.id };

    if (options.filters?.result) {
      where.result = { in: options.filters.result };
    }
    if (options.filters?.dateRange) {
      where.participatedAt = {
        gte: options.filters.dateRange.from,
        lte: options.filters.dateRange.to
      };
    }
    if (options.filters?.search) {
      where.title = { contains: options.filters.search, mode: 'insensitive' };
    }

    const orderBy: any = options.sort?.field ? {
      [options.sort.field]: options.sort.direction
    } : { participatedAt: 'desc' };

    const [participations, total] = await Promise.all([
      this.bidderRepository.findParticipationHistoryByBidderId(profile.id, {
        skip,
        take: limit,
        where,
        orderBy
      }),
      this.bidderRepository.countParticipationHistory(profile.id, where)
    ]);

    // Calcular resumo
    const wonCount = participations.filter(p => p.result === 'WON').length;
    const winRate = total > 0 ? (wonCount / total) * 100 : 0;

    const summary = {
      totalParticipations: total,
      totalWon: wonCount,
      totalLost: total - wonCount,
      winRate,
      totalSpent: participations
        .filter((p: any) => p.result === 'WON')
        .reduce((sum: Decimal, p: any) => sum.add(p.finalBid || 0), new Decimal(0)),
      averageBid: total > 0 ?
        participations.filter((p: any) => p.maxBid).reduce((sum: Decimal, p: any) => sum.add(p.maxBid || 0), new Decimal(0)).div(total) :
        new Decimal(0)
    };

    const totalPages = Math.ceil(total / limit);

    return {
      data: participations.map(this.mapParticipationHistory),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary
    };
  }

  // -----------------------------
  // Mapeadores (Map to TypeScript interfaces)
  // -----------------------------

  private mapBidderProfile(profile: any): BidderProfile {
    return {
      id: profile.id,
      userId: BigInt(profile.userId),
      fullName: profile.fullName,
      cpf: profile.cpf,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      documentStatus: profile.documentStatus,
      submittedDocuments: profile.submittedDocuments,
      emailNotifications: profile.emailNotifications,
      smsNotifications: profile.smsNotifications,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  private mapWonLot(wonLot: any): WonLot {
    return {
      id: wonLot.id,
      bidderId: wonLot.bidderId,
      lotId: BigInt(wonLot.lotId),
      auctionId: BigInt(wonLot.auctionId),
      title: wonLot.title,
      finalBid: wonLot.finalBid,
      wonAt: wonLot.wonAt,
      status: wonLot.status,
      paymentStatus: wonLot.paymentStatus,
      totalAmount: wonLot.totalAmount,
      paidAmount: wonLot.paidAmount,
      dueDate: wonLot.dueDate,
      deliveryStatus: wonLot.deliveryStatus,
      trackingCode: wonLot.trackingCode,
      invoiceUrl: wonLot.invoiceUrl,
      receiptUrl: wonLot.receiptUrl,
      createdAt: wonLot.createdAt,
      updatedAt: wonLot.updatedAt
    };
  }

  private mapBidderNotification(notification: any): BidderNotification {
    return {
      id: notification.id,
      bidderId: notification.bidderId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt
    };
  }

  /**
   * Atualiza método de pagamento
   */
  async updatePaymentMethod(methodId: string, data: any): Promise<ApiResponse<PaymentMethod>> {
    try {
      const id = BigInt(methodId);
      const updated = await this.bidderRepository.updatePaymentMethod(id, data);
      return {
        success: true,
        data: this.mapPaymentMethod(updated)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar método de pagamento'
      };
    }
  }

  /**
   * Deleta método de pagamento
   */
  async deletePaymentMethod(methodId: string): Promise<ApiResponse<null>> {
    try {
      const id = BigInt(methodId);
      await this.bidderRepository.deletePaymentMethod(id);
      return {
        success: true,
        data: null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar método de pagamento'
      };
    }
  }

  private mapPaymentMethod(method: any): PaymentMethod {
    return {
      id: method.id,
      bidderId: method.bidderId,
      type: method.type,
      isDefault: method.isDefault,
      cardLast4: method.cardLast4,
      cardBrand: method.cardBrand,
      cardToken: method.cardToken,
      pixKey: method.pixKey,
      pixKeyType: method.pixKeyType,
      isActive: method.isActive,
      expiresAt: method.expiresAt,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt
    };
  }

  private mapParticipationHistory(history: any): ParticipationHistory {
    return {
      id: history.id,
      bidderId: history.bidderId,
      lotId: BigInt(history.lotId),
      auctionId: BigInt(history.auctionId),
      title: history.title,
      auctionName: history.auctionName,
      maxBid: history.maxBid,
      finalBid: history.finalBid,
      result: history.result,
      participatedAt: history.participatedAt,
      bidCount: history.bidCount,
      createdAt: history.createdAt
    };
  }
}

// Export singleton instance
export const bidderService = new BidderService();
