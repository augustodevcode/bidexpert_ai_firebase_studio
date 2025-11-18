// src/app/api/[[...slug]]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tenantContext } from '@/lib/tenant-context';
import { getSession } from '@/server/lib/session';
import { prisma } from '@/lib/prisma';

async function handler(req: NextRequest) {
  const pathname = req.nextUrl.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  const segments = pathname ? pathname.split('/') : [];
  console.log('[api catch-all] segments', segments);

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
