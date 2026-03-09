/**
 * @file Temporary diagnostic endpoint for lots query debugging
 * @description Tests the same queries used by Home V2 segment-data.ts
 * TODO: Remove after debugging is complete
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { insensitiveContains, getDatabaseType } from '@/lib/prisma/query-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {
    databaseType: getDatabaseType(),
    databaseUrl: (process.env.DATABASE_URL || '').substring(0, 30) + '...',
    timestamp: new Date().toISOString(),
  };

  // 1. Count lots by status
  try {
    const statusCounts = await prisma.$queryRawUnsafe<Array<{ status: string; count: bigint }>>(
      'SELECT status, COUNT(*) as count FROM "Lot" GROUP BY status ORDER BY count DESC'
    );
    results.lotStatusCounts = statusCounts.map(r => ({
      status: r.status,
      count: Number(r.count),
    }));
  } catch (e: any) {
    results.lotStatusCountsError = e.message;
  }

  // 2. Count total lots
  try {
    const totalLots = await prisma.lot.count();
    results.totalLots = totalLots;
  } catch (e: any) {
    results.totalLotsError = e.message;
  }

  // 3. Count lots with target statuses
  try {
    const targetLots = await prisma.lot.count({
      where: {
        status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
      },
    });
    results.lotsWithTargetStatus = targetLots;
  } catch (e: any) {
    results.lotsWithTargetStatusError = e.message;
  }

  // 4. Try the full lots query (veiculos patterns)
  try {
    const patterns = ['veículo', 'veiculo', 'veículos', 'veiculos', 'carro', 'moto', 'caminhão', 'caminhao', 'ônibus', 'onibus', 'automóvel', 'automovel'];
    
    const lots = await prisma.lot.findMany({
      where: {
        status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
        OR: patterns.flatMap(pattern => [
          { title: insensitiveContains(pattern) },
          { LotCategory: { name: insensitiveContains(pattern) } },
          { type: insensitiveContains(pattern) },
        ]),
      },
      select: { id: true, title: true, status: true, type: true, categoryId: true },
      take: 5,
    });
    results.veiculosLotsFound = lots.length;
    results.veiculosLotsSample = lots.map(l => ({
      id: Number(l.id),
      title: l.title,
      status: l.status,
      type: l.type,
      categoryId: l.categoryId ? Number(l.categoryId) : null,
    }));
  } catch (e: any) {
    results.veiculosQueryError = e.message;
    results.veiculosQueryStack = e.stack?.substring(0, 500);
  }

  // 5. Try simpler query (no OR patterns)
  try {
    const simpleLots = await prisma.lot.findMany({
      where: {
        status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
      },
      select: { id: true, title: true, status: true, type: true },
      take: 5,
    });
    results.simpleLotsFound = simpleLots.length;
    results.simpleLotsSample = simpleLots.map(l => ({
      id: Number(l.id),
      title: l.title,
      status: l.status,
      type: l.type,
    }));
  } catch (e: any) {
    results.simpleQueryError = e.message;
  }

  // 6. Check lot categories
  try {
    const categories = await prisma.lotCategory.findMany({
      select: { id: true, name: true, slug: true },
    });
    results.categories = categories.map(c => ({
      id: Number(c.id),
      name: c.name,
      slug: c.slug,
    }));
  } catch (e: any) {
    results.categoriesError = e.message;
  }

  // 7. Check lot types
  try {
    const types = await prisma.$queryRawUnsafe<Array<{ type: string; count: bigint }>>(
      'SELECT type, COUNT(*) as count FROM "Lot" GROUP BY type ORDER BY count DESC LIMIT 10'
    );
    results.lotTypes = types.map(r => ({
      type: r.type,
      count: Number(r.count),
    }));
  } catch (e: any) {
    results.lotTypesError = e.message;
  }

  // 8. Check Seller model fields
  try {
    const sellerColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'Seller' ORDER BY ordinal_position`
    );
    results.sellerColumns = sellerColumns.map(c => c.column_name);
  } catch (e: any) {
    results.sellerColumnsError = e.message;
  }

  return NextResponse.json(results, { status: 200 });
}
