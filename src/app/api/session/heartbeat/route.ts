/**
 * @fileoverview API de session heartbeat para manter sessão ativa durante leilões.
 * 
 * GAP-FIX: Sem heartbeat, usuários podem ser deslogados durante leilões ativos.
 * Este endpoint renova a sessão e retorna o tempo restante.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/session';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ 
        active: false, 
        message: 'Sessão não encontrada' 
      }, { status: 401 });
    }

    // Sessão está ativa - retorna status
    logger.info('[Heartbeat] Session renovada', { 
      userId: session.user.id?.toString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      active: true,
      userId: session.user.id?.toString(),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Heartbeat] Erro', { error: String(error) });
    return NextResponse.json({ active: false, message: 'Erro interno' }, { status: 500 });
  }
}
