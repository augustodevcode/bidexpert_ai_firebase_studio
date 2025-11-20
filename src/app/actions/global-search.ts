'use server';

import { prisma } from '@/lib/prisma';

export type SearchResultItem = {
  id: string;
  type: 'auction' | 'lot' | 'user';
  title: string;
  subtitle?: string;
  url: string;
};

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  const [auctions, lots, users] = await Promise.all([
    prisma.auction.findMany({
      where: {
        OR: [
          { title: { contains: query } }, // Case-insensitive by default in MySQL/Prisma usually, but depends on collation
          { description: { contains: query } },
        ],
      },
      take: 5,
      select: { id: true, title: true, description: true },
    }),
    prisma.lot.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { number: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 5,
      select: { id: true, title: true, number: true, auctionId: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true, email: true },
    }),
  ]);

  const results: SearchResultItem[] = [];

  auctions.forEach((auction) => {
    results.push({
      id: auction.id.toString(),
      type: 'auction',
      title: auction.title,
      subtitle: 'Leilão',
      url: `/admin/auctions/${auction.id}`,
    });
  });

  lots.forEach((lot) => {
    results.push({
      id: lot.id.toString(),
      type: 'lot',
      title: lot.title,
      subtitle: `Lote #${lot.number || ''}`,
      url: `/admin/lots/${lot.id}`, // Assuming this route exists
    });
  });

  users.forEach((user) => {
    results.push({
      id: user.id.toString(),
      type: 'user',
      title: user.fullName || user.email,
      subtitle: user.email,
      url: `/admin/users/${user.id}`,
    });
  });

  return results;
}
