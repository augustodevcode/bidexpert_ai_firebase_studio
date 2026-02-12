/**
 * @fileoverview API Route para processar leilões agendados via cron job.
 * Verifica a cada chamada se existem leilões com openDate <= now()
 * e os transiciona automaticamente para OPEN.
 */

import { NextResponse } from 'next/server';
import { auctionStateMachine } from '@/lib/auction-state-machine';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verificar token de segurança para cron jobs
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');

    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[CronJob] Processando leilões agendados...');

    const result = await auctionStateMachine.processScheduledAuctions();

    logger.info(`[CronJob] Resultado: ${result.opened} abertos, ${result.errors.length} erros`);

    return NextResponse.json({
      success: true,
      opened: result.opened,
      errors: result.errors,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[CronJob] Erro ao processar leilões agendados', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Erro interno ao processar leilões agendados' },
      { status: 500 }
    );
  }
}
