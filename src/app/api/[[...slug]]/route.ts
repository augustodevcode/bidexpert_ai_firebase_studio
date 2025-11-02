// src/app/api/[[...slug]]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tenantContext } from '@/lib/tenant-context';
import { getSession } from '@/server/lib/session';

async function handler(req: NextRequest) {
  // Simula uma resposta de API
  return NextResponse.json({ message: 'API endpoint reached. This is a generic handler.' });
}

// Wrapper para as rotas de API para injetar o tenantId no contexto
async function apiHandler(req: NextRequest) {
  const session = await getSession();
  const tenantId = session?.tenantId || '1'; // Fallback para o tenant '1' se não houver sessão

  return tenantContext.run({ tenantId }, () => handler(req));
}

export { apiHandler as GET, apiHandler as POST, apiHandler as PUT, apiHandler as DELETE, apiHandler as PATCH };
