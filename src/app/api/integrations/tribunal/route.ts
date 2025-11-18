import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/get-tenant-id';
import { queryTribunal } from '@/lib/mock-integrations';
import logger from '@/lib/logger';

/**
 * POST /api/integrations/tribunal
 * Query Tribunal para consultar processo judicial
 * Body: { courtCode: string, processNumber: string }
 */
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { courtCode, processNumber } = body;

    if (!courtCode || !processNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: courtCode, processNumber' },
        { status: 400 }
      );
    }

    const tribunalData = await queryTribunal({ courtCode, processNumber });

    logger.info('[TRIBUNAL_QUERY]', {
      tenantId,
      courtCode,
      processNumber,
      result: tribunalData ? 'success' : 'not_found',
    });

    return NextResponse.json(
      {
        success: true,
        data: tribunalData,
        testId: 'api-integrations-tribunal-response',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[TRIBUNAL_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query Tribunal' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/tribunal?courtCode=SP&processNumber=00001
 * Query Tribunal via GET (para testes)
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courtCode = searchParams.get('courtCode');
    const processNumber = searchParams.get('processNumber');

    if (!courtCode || !processNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: courtCode, processNumber' },
        { status: 400 }
      );
    }

    const tribunalData = await queryTribunal({ courtCode, processNumber });

    return NextResponse.json(
      {
        success: true,
        data: tribunalData,
        testId: 'api-integrations-tribunal-response',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[TRIBUNAL_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query Tribunal' },
      { status: 500 }
    );
  }
}
