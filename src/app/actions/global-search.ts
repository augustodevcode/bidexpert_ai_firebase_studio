'use server';

import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { insensitiveContains } from '@/lib/prisma/query-helpers';

const MIN_QUERY_LENGTH = 2;
const RESULTS_PER_ENTITY = 6;
const MAX_TOTAL_RESULTS = 15;

const toBigIntOrNull = (value: string): bigint | null => {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const scoreMatch = (result: SearchResultItem, normalizedQuery: string): number => {
  const title = result.title.toLowerCase();
  if (title === normalizedQuery) {
    return 0;
  }
  if (title.startsWith(normalizedQuery)) {
    return 1;
  }
  if (title.includes(normalizedQuery)) {
    return 2;
  }

  const subtitle = (result.subtitle ?? '').toLowerCase();
  if (subtitle.startsWith(normalizedQuery)) {
    return 3;
  }
  if (subtitle.includes(normalizedQuery)) {
    return 4;
  }

  return 5;
};

export type SearchResultItem = {
  id: string;
  type: 'auction' | 'lot' | 'user';
  title: string;
  subtitle?: string;
  url: string;
};

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || normalizedQuery.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const tenantId = BigInt(await getTenantIdFromRequest(false));
  const numericQuery = toBigIntOrNull(normalizedQuery);

  const [auctions, lots, users] = await Promise.all([
    prisma.auction.findMany({
      where: {
        tenantId,
        OR: [
          { title: insensitiveContains(normalizedQuery) },
          { description: insensitiveContains(normalizedQuery) },
          { publicId: insensitiveContains(normalizedQuery) },
          { slug: insensitiveContains(normalizedQuery) },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      take: RESULTS_PER_ENTITY,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, publicId: true, title: true, status: true },
    }),
    prisma.lot.findMany({
      where: {
        tenantId,
        OR: [
          { title: insensitiveContains(normalizedQuery) },
          { number: insensitiveContains(normalizedQuery) },
          { description: insensitiveContains(normalizedQuery) },
          { publicId: insensitiveContains(normalizedQuery) },
          { slug: insensitiveContains(normalizedQuery) },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      take: RESULTS_PER_ENTITY,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, publicId: true, title: true, number: true, status: true },
    }),
    prisma.user.findMany({
      where: {
        UsersOnTenants: {
          some: {
            tenantId,
          },
        },
        OR: [
          { fullName: insensitiveContains(normalizedQuery) },
          { email: insensitiveContains(normalizedQuery) },
          { cpf: insensitiveContains(normalizedQuery) },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      take: RESULTS_PER_ENTITY,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, fullName: true, email: true },
    }),
  ]);

  const results: SearchResultItem[] = [];

  auctions.forEach((auction) => {
    const auctionIdentifier = auction.publicId ?? auction.id.toString();
    results.push({
      id: auction.id.toString(),
      type: 'auction',
      title: auction.title,
      subtitle: `Leilao ${auctionIdentifier} - ${auction.status}`,
      url: `/admin/auctions/${auctionIdentifier}/edit`,
    });
  });

  lots.forEach((lot) => {
    const lotIdentifier = lot.publicId ?? lot.id.toString();
    const lotLabel = lot.number ? `Lote #${lot.number}` : `Lote ${lotIdentifier}`;
    results.push({
      id: lot.id.toString(),
      type: 'lot',
      title: lot.title,
      subtitle: `${lotLabel} - ${lot.status}`,
      url: `/admin/lots/${lotIdentifier}/edit`,
    });
  });

  users.forEach((user) => {
    results.push({
      id: user.id.toString(),
      type: 'user',
      title: user.fullName || user.email,
      subtitle: user.email,
      url: `/admin-plus/users/${user.id.toString()}`,
    });
  });

  return results
    .sort((a, b) => scoreMatch(a, normalizedQuery.toLowerCase()) - scoreMatch(b, normalizedQuery.toLowerCase()))
    .slice(0, MAX_TOTAL_RESULTS);
}
