// src/app/api/[[...slug]]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tenantContext } from '@/lib/tenant-context';
import { getSession } from '@/server/lib/session';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

async function handler(req: NextRequest) {
  const pathname = req.nextUrl.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  const segments = pathname ? pathname.split('/') : [];
  console.log('[api catch-all] segments', segments);

  // Diagnostics endpoint
  if (segments[0] === 'diagnostics') {
    const diagnostics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_PREFIX: process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.split('://')[0] 
          : 'NOT_SET',
        DATABASE_URL_HOST: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0]?.split(':')[0] || 'PARSE_ERROR'
          : 'NOT_SET',
        PRISMA_SCHEMA: process.env.PRISMA_SCHEMA,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      prisma: {
        status: 'pending',
        error: null as string | null,
        tableCount: null as number | null,
        sampleTables: [] as string[],
      },
    };

    let testPrisma: PrismaClient | null = null;
    try {
      testPrisma = new PrismaClient({ log: ['error'] });
      const result = await testPrisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 10
      `;
      diagnostics.prisma.status = 'connected';
      diagnostics.prisma.tableCount = result.length;
      diagnostics.prisma.sampleTables = result.map(r => r.table_name);

      try {
        const tenantCount = await testPrisma.tenant.count();
        (diagnostics.prisma as any).tenantCount = tenantCount;
      } catch (e: any) {
        (diagnostics.prisma as any).tenantError = e.message?.substring(0, 200);
      }
    } catch (error: any) {
      diagnostics.prisma.status = 'error';
      diagnostics.prisma.error = error.message?.substring(0, 500) || 'Unknown error';
    } finally {
      if (testPrisma) await testPrisma.$disconnect();
    }

    return NextResponse.json(diagnostics);
  }

  if (segments[0] === 'system' && segments[1] === 'db' && segments[2] === 'metrics') {
    try {
      const [tenants, users, auctions, lots, bids] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.auction.count(),
        prisma.lot.count(),
        prisma.bid.count(),
      ]);

      return NextResponse.json({ tenants, users, auctions, lots, bids });
    } catch (error) {
      console.error('[api/system/db/metrics] fallback handler failed', error);
      return NextResponse.json({ tenants: 0, users: 0, auctions: 0, lots: 0, bids: 0 });
    }
  }

  // Simula uma resposta de API para rotas ainda não implementadas
  return NextResponse.json({ message: 'API endpoint reached. This is a generic handler.' });
}

// Wrapper para as rotas de API para injetar o tenantId no contexto
async function apiHandler(req: NextRequest) {
  const session = await getSession();
  const tenantId = session?.tenantId || '1'; // Fallback para o tenant '1' se não houver sessão

  return tenantContext.run({ tenantId }, () => handler(req));
}

export { apiHandler as GET, apiHandler as POST, apiHandler as PUT, apiHandler as DELETE, apiHandler as PATCH };
