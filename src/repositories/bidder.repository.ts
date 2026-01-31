// src/repositories/bidder.repository.ts
/**
 * @fileoverview Repository para abstração de dados do bidder dashboard
 * Segue o padrão repository do projeto para acesso a dados
 * IDs usam bigint conforme diretriz do projeto
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { BidderProfile, WonLot, BidderNotification, PaymentMethod, ParticipationHistory } from '@/types/bidder-dashboard';

export class BidderRepository {
  /**
   * Busca perfil do bidder por userId
   */
  async findByUserId(userId: bigint) {
    return prisma.bidderProfile.findUnique({
      where: { userId }
    });
  }

  /**
   * Cria perfil do bidder
   */
  async create(data: Prisma.BidderProfileCreateInput) {
    return prisma.bidderProfile.create({ data });
  }

  /**
   * Atualiza perfil do bidder
   */
  async update(userId: bigint, data: Prisma.BidderProfileUpdateInput) {
    return prisma.bidderProfile.update({
      where: { userId },
      data
    });
  }

  /**
   * Busca lotes arrematados do bidder
   */
  async findWonLotsByBidderId(
    bidderId: bigint,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.WonLotWhereInput;
      orderBy?: Prisma.WonLotOrderByWithRelationInput;
    } = {}
  ) {
    return prisma.wonLot.findMany({
      where: { bidderId, ...options.where },
      orderBy: options.orderBy || { wonAt: 'desc' },
      skip: options.skip,
      take: options.take
    });
  }

  /**
   * Conta lotes arrematados do bidder
   */
  async countWonLots(bidderId: bigint, where?: Prisma.WonLotWhereInput) {
    return prisma.wonLot.count({
      where: { bidderId, ...where }
    });
  }

  /**
   * Busca lote arrematado específico
   */
  async findWonLotById(id: bigint) {
    return prisma.wonLot.findUnique({
      where: { id }
    });
  }

  /**
   * Atualiza lote arrematado
   */
  async updateWonLot(id: bigint, data: Prisma.WonLotUpdateInput) {
    return prisma.wonLot.update({
      where: { id },
      data
    });
  }

  /**
   * Cria lote arrematado
   */
  async createWonLot(data: Prisma.WonLotCreateInput) {
    return prisma.wonLot.create({ data });
  }

  /**
   * Busca métodos de pagamento do bidder
   */
  async findPaymentMethodsByBidderId(bidderId: bigint) {
    return prisma.paymentMethod.findMany({
      where: { bidderId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Busca método de pagamento específico
   */
  async findPaymentMethodById(id: bigint) {
    return prisma.paymentMethod.findUnique({
      where: { id }
    });
  }

  /**
   * Cria método de pagamento
   */
  async createPaymentMethod(bidderId: bigint, data: Prisma.PaymentMethodCreateInput) {
    return prisma.paymentMethod.create({
      data: {
        bidderId,
        ...data
      }
    });
  }

  /**
   * Atualiza método de pagamento
   */
  async updatePaymentMethod(id: bigint, data: Prisma.PaymentMethodUpdateInput) {
    return prisma.paymentMethod.update({
      where: { id },
      data
    });
  }

  /**
   * Remove método de pagamento
   */
  async deletePaymentMethod(id: bigint) {
    return prisma.paymentMethod.delete({
      where: { id }
    });
  }

  /**
   * Busca notificações do bidder
   */
  async findNotificationsByBidderId(
    bidderId: bigint,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.BidderNotificationWhereInput;
      orderBy?: Prisma.BidderNotificationOrderByWithRelationInput;
    } = {}
  ) {
    return prisma.bidderNotification.findMany({
      where: { bidderId, ...options.where },
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take
    });
  }

  /**
   * Conta notificações do bidder
   */
  async countNotifications(bidderId: bigint, where?: Prisma.BidderNotificationWhereInput) {
    return prisma.bidderNotification.count({
      where: { bidderId, ...where }
    });
  }

  /**
   * Atualiza notificações como lidas
   */
  async markNotificationsAsRead(ids: bigint[]) {
    return prisma.bidderNotification.updateMany({
      where: { id: { in: ids } },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Busca histórico de participações do bidder
   */
  async findParticipationHistoryByBidderId(
    bidderId: bigint,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.ParticipationHistoryWhereInput;
      orderBy?: Prisma.ParticipationHistoryOrderByWithRelationInput;
    } = {}
  ) {
    return prisma.participationHistory.findMany({
      where: { bidderId, ...options.where },
      orderBy: options.orderBy || { participatedAt: 'desc' },
      skip: options.skip,
      take: options.take
    });
  }

  /**
   * Conta histórico de participações
   */
  async countParticipationHistory(bidderId: bigint, where?: Prisma.ParticipationHistoryWhereInput) {
    return prisma.participationHistory.count({
      where: { bidderId, ...where }
    });
  }

  /**
   * Busca todos os bidders (para admin)
   */
  async findAllBidders(options: {
    skip?: number;
    take?: number;
    where?: Prisma.BidderProfileWhereInput;
    orderBy?: Prisma.BidderProfileOrderByWithRelationInput;
    include?: Prisma.BidderProfileInclude;
  } = {}) {
    return prisma.bidderProfile.findMany({
      where: options.where,
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
      include: options.include || {
        user: true,
        _count: {
          select: {
            wonLots: true,
            notifications: true,
            paymentMethods: true
          }
        }
      }
    });
  }

  /**
   * Conta total de bidders (para admin)
   */
  async countBidders(where?: Prisma.BidderProfileWhereInput) {
    return prisma.bidderProfile.count({
      where
    });
  }

  /**
   * Busca bidder por ID (para admin)
   */
  async findBidderById(id: bigint, include?: Prisma.BidderProfileInclude) {
    return prisma.bidderProfile.findUnique({
      where: { id },
      include: include || {
        user: true,
        wonLots: true,
        notifications: true,
        paymentMethods: true,
        participationHistory: true,
        _count: {
          select: {
            wonLots: true,
            notifications: true,
            paymentMethods: true
          }
        }
      }
    });
  }

  /**
   * Atualiza status de documentos do bidder
   */
  async updateDocumentStatus(userId: bigint, status: string) {
    return prisma.bidderProfile.update({
      where: { userId },
      data: { documentStatus: status as any }
    });
  }

  /**
   * Busca bidders por status de documentação
   */
  async findBiddersByDocumentStatus(status: string) {
    return prisma.bidderProfile.findMany({
      where: { documentStatus: status as any },
      include: {
        user: true,
        _count: {
          select: {
            wonLots: true,
            notifications: true,
            paymentMethods: true
          }
        }
      }
    });
  }
}
