/**
 * @fileoverview Serviço de Entity Links para MediaItem.
 * Faz reverse-lookup em todas as entidades que referenciam um MediaItem
 * via FK (imageMediaId, logoMediaId, etc.) e retorna informações da entidade vinculada.
 * Quando adicionar novo entity com media FK, atualizar este serviço.
 */
import { prisma } from '@/lib/prisma';

export interface EntityLink {
  entityType: string;
  entityId: string;
  publicId: string | null;
  entityName: string;
  adminUrl: string;
  icon: string;
}

/**
 * Busca todas as entidades vinculadas a um MediaItem pelo seu ID.
 */
export async function getEntityLinksForMediaItem(mediaItemId: bigint): Promise<EntityLink[]> {
  const links: EntityLink[] = [];

  try {
    // Asset → imageMediaId
    const assets = await prisma.asset.findMany({
      where: { imageMediaId: mediaItemId },
      select: { id: true, publicId: true, title: true },
    });
    for (const a of assets) {
      links.push({
        entityType: 'Ativo',
        entityId: String(a.id),
        publicId: a.publicId ?? null,
        entityName: a.title || `Ativo #${a.publicId || a.id}`,
        adminUrl: `/admin/assets/${a.id}`,
        icon: 'Package',
      });
    }

    // Auction → imageMediaId
    const auctions = await prisma.auction.findMany({
      where: { imageMediaId: mediaItemId },
      select: { id: true, publicId: true, title: true },
    });
    for (const a of auctions) {
      links.push({
        entityType: 'Leilão',
        entityId: String(a.id),
        publicId: a.publicId ?? null,
        entityName: a.title || `Leilão #${a.publicId || a.id}`,
        adminUrl: `/admin/auctions/${a.id}`,
        icon: 'Gavel',
      });
    }

    // Auctioneer → logoMediaId
    const auctioneers = await prisma.auctioneer.findMany({
      where: { logoMediaId: mediaItemId },
      select: { id: true, publicId: true, name: true },
    });
    for (const a of auctioneers) {
      links.push({
        entityType: 'Leiloeiro',
        entityId: String(a.id),
        publicId: a.publicId ?? null,
        entityName: a.name || `Leiloeiro #${a.publicId || a.id}`,
        adminUrl: `/admin/auctioneers/${a.id}`,
        icon: 'User',
      });
    }

    // Lot → imageMediaId
    const lots = await prisma.lot.findMany({
      where: { imageMediaId: mediaItemId },
      select: { id: true, publicId: true, title: true },
    });
    for (const l of lots) {
      links.push({
        entityType: 'Lote',
        entityId: String(l.id),
        publicId: l.publicId ?? null,
        entityName: l.title || `Lote #${l.publicId || l.id}`,
        adminUrl: `/admin/lots/${l.id}`,
        icon: 'Box',
      });
    }

    // Seller → logoMediaId
    const sellers = await prisma.seller.findMany({
      where: { logoMediaId: mediaItemId },
      select: { id: true, publicId: true, name: true },
    });
    for (const s of sellers) {
      links.push({
        entityType: 'Comitente',
        entityId: String(s.id),
        publicId: s.publicId ?? null,
        entityName: s.name || `Comitente #${s.publicId || s.id}`,
        adminUrl: `/admin/sellers/${s.id}`,
        icon: 'Building2',
      });
    }

    // LotCategory → logoMediaId, coverImageMediaId, megaMenuImageMediaId
    const categories = await prisma.lotCategory.findMany({
      where: {
        OR: [
          { logoMediaId: mediaItemId },
          { coverImageMediaId: mediaItemId },
          { megaMenuImageMediaId: mediaItemId },
        ],
      },
      select: { id: true, name: true, slug: true },
    });
    for (const c of categories) {
      links.push({
        entityType: 'Categoria',
        entityId: String(c.id),
        publicId: c.slug ?? null,
        entityName: c.name || `Categoria #${c.id}`,
        adminUrl: `/admin/categories/${c.id}`,
        icon: 'Tag',
      });
    }

    // Subcategory → iconMediaId
    const subcategories = await prisma.subcategory.findMany({
      where: { iconMediaId: mediaItemId },
      select: { id: true, name: true, slug: true },
    });
    for (const s of subcategories) {
      links.push({
        entityType: 'Subcategoria',
        entityId: String(s.id),
        publicId: s.slug ?? null,
        entityName: s.name || `Subcategoria #${s.id}`,
        adminUrl: `/admin/subcategories/${s.id}`,
        icon: 'Tags',
      });
    }

    // DirectSaleOffer → imageMediaId
    const directSales = await prisma.directSaleOffer.findMany({
      where: { imageMediaId: mediaItemId },
      select: { id: true, publicId: true, title: true },
    });
    for (const d of directSales) {
      links.push({
        entityType: 'Venda Direta',
        entityId: String(d.id),
        publicId: d.publicId ?? null,
        entityName: d.title || `Venda Direta #${d.publicId || d.id}`,
        adminUrl: `/admin/direct-sales/${d.id}`,
        icon: 'ShoppingCart',
      });
    }

    // AssetMedia junction
    const assetMedia = await prisma.assetMedia.findMany({
      where: { mediaItemId },
      include: { Asset: { select: { id: true, publicId: true, title: true } } },
    });
    for (const am of assetMedia) {
      const existing = links.find(l => l.entityType === 'Ativo' && l.entityId === String(am.Asset.id));
      if (!existing) {
        links.push({
          entityType: 'Ativo',
          entityId: String(am.Asset.id),
          publicId: am.Asset.publicId ?? null,
          entityName: am.Asset.title || `Ativo #${am.Asset.publicId || am.Asset.id}`,
          adminUrl: `/admin/assets/${am.Asset.id}`,
          icon: 'Package',
        });
      }
    }
  } catch (error) {
    console.error('[EntityLinksService] Error fetching entity links:', error);
  }

  return links;
}

/**
 * Busca entity links para múltiplos MediaItems de uma vez (batch).
 */
export async function getEntityLinksForMediaItems(
  mediaItemIds: bigint[]
): Promise<Record<string, EntityLink[]>> {
  const result: Record<string, EntityLink[]> = {};

  // Batch queries para performance
  const [assets, auctions, auctioneers, lots, sellers, categories, subcategories, directSales, assetMediaList] =
    await Promise.all([
      prisma.asset.findMany({
        where: { imageMediaId: { in: mediaItemIds } },
        select: { id: true, publicId: true, title: true, imageMediaId: true },
      }),
      prisma.auction.findMany({
        where: { imageMediaId: { in: mediaItemIds } },
        select: { id: true, publicId: true, title: true, imageMediaId: true },
      }),
      prisma.auctioneer.findMany({
        where: { logoMediaId: { in: mediaItemIds } },
        select: { id: true, publicId: true, name: true, logoMediaId: true },
      }),
      prisma.lot.findMany({
        where: { imageMediaId: { in: mediaItemIds } },
        select: { id: true, publicId: true, title: true, imageMediaId: true },
      }),
      prisma.seller.findMany({
        where: { logoMediaId: { in: mediaItemIds } },
        select: { id: true, publicId: true, name: true, logoMediaId: true },
      }),
      prisma.lotCategory.findMany({
        where: {
          OR: [
            { logoMediaId: { in: mediaItemIds } },
            { coverImageMediaId: { in: mediaItemIds } },
            { megaMenuImageMediaId: { in: mediaItemIds } },
          ],
        },
        select: { id: true, name: true, slug: true, logoMediaId: true, coverImageMediaId: true, megaMenuImageMediaId: true },
      }),
      prisma.subcategory.findMany({
        where: { iconMediaId: { in: mediaItemIds } },
        select: { id: true, name: true, slug: true, iconMediaId: true },
      }),
      prisma.directSaleOffer.findMany({
        where: { imageMediaId: { in: mediaItemIds } },
        select: { id: true, publicId: true, title: true, imageMediaId: true },
      }),
      prisma.assetMedia.findMany({
        where: { mediaItemId: { in: mediaItemIds } },
        include: { Asset: { select: { id: true, publicId: true, title: true } } },
      }),
    ]);

  // Initialize all IDs
  for (const id of mediaItemIds) {
    result[String(id)] = [];
  }

  // Map entities to media items
  for (const a of assets) {
    if (a.imageMediaId) {
      result[String(a.imageMediaId)]?.push({
        entityType: 'Ativo', entityId: String(a.id), publicId: a.publicId ?? null,
        entityName: a.title || `Ativo #${a.publicId || a.id}`, adminUrl: `/admin/assets/${a.id}`, icon: 'Package',
      });
    }
  }
  for (const a of auctions) {
    if (a.imageMediaId) {
      result[String(a.imageMediaId)]?.push({
        entityType: 'Leilão', entityId: String(a.id), publicId: a.publicId ?? null,
        entityName: a.title || `Leilão #${a.publicId || a.id}`, adminUrl: `/admin/auctions/${a.id}`, icon: 'Gavel',
      });
    }
  }
  for (const a of auctioneers) {
    if (a.logoMediaId) {
      result[String(a.logoMediaId)]?.push({
        entityType: 'Leiloeiro', entityId: String(a.id), publicId: a.publicId ?? null,
        entityName: a.name || `Leiloeiro #${a.publicId || a.id}`, adminUrl: `/admin/auctioneers/${a.id}`, icon: 'User',
      });
    }
  }
  for (const l of lots) {
    if (l.imageMediaId) {
      result[String(l.imageMediaId)]?.push({
        entityType: 'Lote', entityId: String(l.id), publicId: l.publicId ?? null,
        entityName: l.title || `Lote #${l.publicId || l.id}`, adminUrl: `/admin/lots/${l.id}`, icon: 'Box',
      });
    }
  }
  for (const s of sellers) {
    if (s.logoMediaId) {
      result[String(s.logoMediaId)]?.push({
        entityType: 'Comitente', entityId: String(s.id), publicId: s.publicId ?? null,
        entityName: s.name || `Comitente #${s.publicId || s.id}`, adminUrl: `/admin/sellers/${s.id}`, icon: 'Building2',
      });
    }
  }
  for (const c of categories) {
    const mediaIds = [c.logoMediaId, c.coverImageMediaId, c.megaMenuImageMediaId].filter(Boolean);
    for (const mid of mediaIds) {
      if (mid) {
        result[String(mid)]?.push({
          entityType: 'Categoria', entityId: String(c.id), publicId: c.slug ?? null,
          entityName: c.name || `Categoria #${c.id}`, adminUrl: `/admin/categories/${c.id}`, icon: 'Tag',
        });
      }
    }
  }
  for (const s of subcategories) {
    if (s.iconMediaId) {
      result[String(s.iconMediaId)]?.push({
        entityType: 'Subcategoria', entityId: String(s.id), publicId: s.slug ?? null,
        entityName: s.name || `Subcategoria #${s.id}`, adminUrl: `/admin/subcategories/${s.id}`, icon: 'Tags',
      });
    }
  }
  for (const d of directSales) {
    if (d.imageMediaId) {
      result[String(d.imageMediaId)]?.push({
        entityType: 'Venda Direta', entityId: String(d.id), publicId: d.publicId ?? null,
        entityName: d.title || `Venda Direta #${d.publicId || d.id}`, adminUrl: `/admin/direct-sales/${d.id}`, icon: 'ShoppingCart',
      });
    }
  }
  for (const am of assetMediaList) {
    const key = String(am.mediaItemId);
    const existing = result[key]?.find(l => l.entityType === 'Ativo' && l.entityId === String(am.Asset.id));
    if (!existing) {
      result[key]?.push({
        entityType: 'Ativo', entityId: String(am.Asset.id), publicId: am.Asset.publicId ?? null,
        entityName: am.Asset.title || `Ativo #${am.Asset.publicId || am.Asset.id}`, adminUrl: `/admin/assets/${am.Asset.id}`, icon: 'Package',
      });
    }
  }

  return result;
}
