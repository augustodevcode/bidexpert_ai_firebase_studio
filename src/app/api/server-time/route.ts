/**
 * @fileoverview API route que retorna o timestamp do servidor para sincronização
 * de countdown timers no cliente. Garante diff < 100ms entre cliente/servidor.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    serverTime: new Date().toISOString(),
    timestamp: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
