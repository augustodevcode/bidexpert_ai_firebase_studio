/**
 * @file Auction Contact Service
 * @description Service para obter informações de contato de leilões com lógica de herança:
 * 1. Busca contatos específicos do leilão
 * 2. Se não houver, busca contatos do leiloeiro responsável
 * 3. Se não houver, usa contatos globais do PlatformSettings
 */

import { PrismaClient } from '@prisma/client';

export interface AuctionContactInfo {
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  source: 'auction' | 'auctioneer' | 'platform';
}

/**
 * Obtém informações de contato para um leilão seguindo a hierarquia de herança
 * @param prisma - Cliente Prisma
 * @param auctionId - ID do leilão
 * @param tenantId - ID do tenant
 * @returns Informações de contato com a fonte (auction, auctioneer ou platform)
 */
export async function getAuctionContact(
  prisma: PrismaClient,
  auctionId: bigint,
  tenantId: bigint
): Promise<AuctionContactInfo> {
  // 1. Buscar dados do leilão com leiloeiro
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId, tenantId },
    select: {
      supportPhone: true,
      supportEmail: true,
      supportWhatsApp: true,
      auctioneerId: true,
      Auctioneer: {
        select: {
          phone: true,
          email: true,
          supportWhatsApp: true,
        },
      },
    },
  });

  if (!auction) {
    throw new Error(`Auction ${auctionId} not found for tenant ${tenantId}`);
  }

  // 2. Verificar se o leilão tem contatos próprios (prioridade máxima)
  if (auction.supportPhone || auction.supportEmail || auction.supportWhatsApp) {
    return {
      phone: auction.supportPhone,
      email: auction.supportEmail,
      whatsapp: auction.supportWhatsApp,
      source: 'auction',
    };
  }

  // 3. Verificar se o leiloeiro tem contatos (prioridade intermediária)
  if (auction.Auctioneer) {
    const { phone, email, supportWhatsApp } = auction.Auctioneer;
    if (phone || email || supportWhatsApp) {
      return {
        phone,
        email,
        whatsapp: supportWhatsApp,
        source: 'auctioneer',
      };
    }
  }

  // 4. Buscar contatos globais do PlatformSettings (fallback)
  const platformSettings = await prisma.platformSettings.findUnique({
    where: { tenantId },
    select: {
      supportPhone: true,
      supportEmail: true,
      supportWhatsApp: true,
    },
  });

  return {
    phone: platformSettings?.supportPhone || null,
    email: platformSettings?.supportEmail || null,
    whatsapp: platformSettings?.supportWhatsApp || null,
    source: 'platform',
  };
}

/**
 * Obtém informações de contato para múltiplos leilões de forma eficiente
 * @param prisma - Cliente Prisma
 * @param auctionIds - Array de IDs de leilões
 * @param tenantId - ID do tenant
 * @returns Map com auctionId como chave e AuctionContactInfo como valor
 */
export async function getMultipleAuctionContacts(
  prisma: PrismaClient,
  auctionIds: bigint[],
  tenantId: bigint
): Promise<Map<bigint, AuctionContactInfo>> {
  const contactsMap = new Map<bigint, AuctionContactInfo>();

  // Buscar todos os leilões de uma vez
  const auctions = await prisma.auction.findMany({
    where: { 
      id: { in: auctionIds }, 
      tenantId 
    },
    select: {
      id: true,
      supportPhone: true,
      supportEmail: true,
      supportWhatsApp: true,
      auctioneerId: true,
      Auctioneer: {
        select: {
          phone: true,
          email: true,
          supportWhatsApp: true,
        },
      },
    },
  });

  // Buscar PlatformSettings uma vez
  const platformSettings = await prisma.platformSettings.findUnique({
    where: { tenantId },
    select: {
      supportPhone: true,
      supportEmail: true,
      supportWhatsApp: true,
    },
  });

  // Processar cada leilão
  for (const auction of auctions) {
    let contactInfo: AuctionContactInfo;

    // Prioridade 1: Contatos do leilão
    if (auction.supportPhone || auction.supportEmail || auction.supportWhatsApp) {
      contactInfo = {
        phone: auction.supportPhone,
        email: auction.supportEmail,
        whatsapp: auction.supportWhatsApp,
        source: 'auction',
      };
    }
    // Prioridade 2: Contatos do leiloeiro
    else if (auction.Auctioneer) {
      const { phone, email, supportWhatsApp } = auction.Auctioneer;
      if (phone || email || supportWhatsApp) {
        contactInfo = {
          phone,
          email,
          whatsapp: supportWhatsApp,
          source: 'auctioneer',
        };
      } else {
        // Prioridade 3: Contatos da plataforma
        contactInfo = {
          phone: platformSettings?.supportPhone || null,
          email: platformSettings?.supportEmail || null,
          whatsapp: platformSettings?.supportWhatsApp || null,
          source: 'platform',
        };
      }
    }
    // Prioridade 3: Contatos da plataforma
    else {
      contactInfo = {
        phone: platformSettings?.supportPhone || null,
        email: platformSettings?.supportEmail || null,
        whatsapp: platformSettings?.supportWhatsApp || null,
        source: 'platform',
      };
    }

    contactsMap.set(auction.id, contactInfo);
  }

  return contactsMap;
}
