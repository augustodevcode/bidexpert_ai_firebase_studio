// src/services/business-code.service.ts
/**
 * @fileoverview Este arquivo contém a classe BusinessCodeService, responsável
 * por gerar códigos de negócio únicos e sequenciais para diversas entidades
 * da aplicação, baseando-se em máscaras configuráveis no PlatformSettings.
 * Garante a unicidade e o formato correto dos códigos.
 */

import { prisma } from '@/lib/prisma';
import { PlatformSettings } from '@prisma/client';
import { format } from 'date-fns';

type EntityType = 'auction' | 'lot' | 'seller' | 'user' | 'auctioneer' | 'asset' | 'category' | 'subcategory';

export class BusinessCodeService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Gera o próximo código sequencial para uma dada entidade, usando a máscara configurada.
   * @param {EntityType} entityType - O tipo da entidade para a qual gerar o código.
   * @param {string} tenantId - O ID do tenant.
   * @returns {Promise<string>} O código de negócio gerado.
   */
  async generateNextCode(entityType: EntityType, tenantId: string): Promise<string> {
    const platformSettings = await this.prisma.platformSettings.findUnique({
      where: { tenantId },
      select: {
        auctionCodeMask: true,
        lotCodeMask: true,
        sellerCodeMask: true,
        userCodeMask: true,
        auctioneerCodeMask: true,
        assetCodeMask: true,
        categoryCodeMask: true,
        subcategoryCodeMask: true,
      },
    });

    if (!platformSettings) {
      throw new Error('Platform settings not found for tenant.');
    }

    let mask: string | null | undefined;
    switch (entityType) {
      case 'auction':
        mask = platformSettings.auctionCodeMask;
        break;
      case 'lot':
        mask = platformSettings.lotCodeMask;
        break;
      case 'seller':
        mask = platformSettings.sellerCodeMask;
        break;
      case 'user':
        mask = platformSettings.userCodeMask;
        break;
      case 'auctioneer':
        mask = platformSettings.auctioneerCodeMask;
        break;
      case 'asset':
        mask = platformSettings.assetCodeMask;
        break;
      case 'category':
        mask = platformSettings.categoryCodeMask;
        break;
      case 'subcategory':
        mask = platformSettings.subcategoryCodeMask;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    if (!mask) {
      // Fallback to a default mask if not configured
      mask = `${entityType.toUpperCase()}-YYYYMM-NNNNN`;
    }

    const now = new Date();
    const yearMonth = format(now, 'yyyyMM');
    const year = format(now, 'yyyy');
    const month = format(now, 'MM');
    const day = format(now, 'dd');

    // Replace dynamic parts of the mask
    let baseCode = mask
      .replace(/YYYY/g, year)
      .replace(/MM/g, month)
      .replace(/DD/g, day);

    // Determine the prefix for the sequence number based on the mask
    const prefixMatch = baseCode.match(/(.*)-NNNNN/);
    const sequencePrefix = prefixMatch ? prefixMatch[1] : baseCode.replace(/-NNNNN/, '');

    // Find the last generated code for the current prefix and entity type
    const lastCode = await this.findLastCode(entityType, tenantId, sequencePrefix);
    let sequenceNumber = 1;

    if (lastCode) {
      const lastSequenceMatch = lastCode.match(/(\d+)$/);
      if (lastSequenceMatch) {
        const lastSequence = parseInt(lastSequenceMatch[1], 10);
        // Check if the prefix matches. If not, reset sequence to 1.
        // This handles cases where the date part of the mask changes (e.g., new month/year)
        if (lastCode.startsWith(sequencePrefix)) {
          sequenceNumber = lastSequence + 1;
        }
      }
    }

    const paddedSequence = String(sequenceNumber).padStart(5, '0'); // NNNNN

    return baseCode.replace(/NNNNN/, paddedSequence);
  }

  private async findLastCode(entityType: EntityType, tenantId: string, prefix: string): Promise<string | null> {
    // This is a simplified approach. For a high-volume system, a dedicated sequence table
    // or a more robust locking mechanism might be needed to prevent race conditions.
    // For now, we'll query the database for the highest existing code matching the prefix.
    const whereClause: any = {
      tenantId,
      codigo: {
        startsWith: prefix,
      },
    };

    let orderByClause: any = { codigo: 'desc' };

    let result;
    switch (entityType) {
      case 'auction':
        result = await this.prisma.auction.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'lot':
        result = await this.prisma.lot.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'seller':
        result = await this.prisma.seller.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'user':
        result = await this.prisma.user.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'auctioneer':
        result = await this.prisma.auctioneer.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'asset':
        result = await this.prisma.asset.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'category':
        result = await this.prisma.lotCategory.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      case 'subcategory':
        result = await this.prisma.subcategory.findFirst({ where: whereClause, orderBy: orderByClause, select: { codigo: true } });
        break;
      default:
        return null;
    }

    return result?.codigo || null;
  }
}
