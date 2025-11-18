import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/get-tenant-id';
import { queryCartorio } from '@/lib/mock-integrations';
import logger from '@/lib/logger';

/**
 * POST /api/integrations/cartorio
 * Query Cartório para consultar matrícula de imóvel
 * Body: { cartorioCode: string, matricula: string }
 */
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cartorioCode, matricula } = body;

    if (!cartorioCode || !matricula) {
      return NextResponse.json(
        { error: 'Missing required fields: cartorioCode, matricula' },
        { status: 400 }
      );
    }

    const cartorioData = await queryCartorio({ cartorioCode, matricula });

    logger.info('[CARTORIO_QUERY]', {
      tenantId,
      cartorioCode,
      matricula,
      result: cartorioData ? 'success' : 'not_found',
    });

    return NextResponse.json(
      {
        success: true,
        data: cartorioData,
        testId: 'api-integrations-cartorio-response',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[CARTORIO_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query Cartório' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/cartorio?cartorioCode=SP&matricula=12345
 * Query Cartório via GET (para testes)
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cartorioCode = searchParams.get('cartorioCode');
    const matricula = searchParams.get('matricula');

    if (!cartorioCode || !matricula) {
      return NextResponse.json(
        { error: 'Missing required fields: cartorioCode, matricula' },
        { status: 400 }
      );
    }

    const cartorioData = await queryCartorio({ cartorioCode, matricula });

    return NextResponse.json(
      {
        success: true,
        data: cartorioData,
        testId: 'api-integrations-cartorio-response',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[CARTORIO_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query Cartório' },
      { status: 500 }
    );
  }
}
