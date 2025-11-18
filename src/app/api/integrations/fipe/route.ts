import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/get-tenant-id';
import { queryFipe } from '@/lib/mock-integrations';
import logger from '@/lib/logger';

/**
 * POST /api/integrations/fipe
 * Query FIPE para consultar valor de veículos
 * Body: { plate: string } ou { brand: string, model: string, year: number }
 */
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plate, brand, model, year } = body;

    if (!plate && (!brand || !model || !year)) {
      return NextResponse.json(
        { error: 'Missing required fields: plate OR (brand, model, year)' },
        { status: 400 }
      );
    }

    const fipeData = await queryFipe({ plate, brand, model, year });

    logger.info('[FIPE_QUERY]', {
      tenantId,
      query: { plate, brand, model, year },
      result: fipeData ? 'success' : 'not_found',
    });

    return NextResponse.json(
      {
        success: true,
        data: fipeData,
        testId: 'api-integrations-fipe-response',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[FIPE_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query FIPE' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/fipe?plate=ABC1234
 * Query FIPE via GET (para testes)
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const plate = searchParams.get('plate');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    if (!plate && (!brand || !model || !year)) {
      return NextResponse.json(
        { error: 'Missing required fields: plate OR (brand, model, year)' },
        { status: 400 }
      );
    }

    const fipeData = await queryFipe({ plate, brand, model, year });

    return NextResponse.json(
      {
        success: true,
        data: fipeData,
        testId: 'api-integrations-fipe-response',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[FIPE_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query FIPE' },
      { status: 500 }
    );
  }
}
