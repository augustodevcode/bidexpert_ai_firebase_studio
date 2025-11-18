import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/get-tenant-id';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import logger from '@/lib/logger';

/**
 * GET /api/admin/blockchain-config
 * Retorna a configuração de blockchain do tenant
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blockchainConfig = await PlatformSettingsService.getBlockchainConfig(tenantId);

    return NextResponse.json(
      {
        success: true,
        data: {
          blockchainConfig,
          testId: 'admin-blockchain-config-container',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[GET_BLOCKCHAIN_CONFIG_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get blockchain config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blockchain-config
 * Atualiza a configuração de blockchain do tenant
 */
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await PlatformSettingsService.updateBlockchainConfig(tenantId, body);

    logger.info('[BLOCKCHAIN_CONFIG_UPDATED]', {
      tenantId,
      enabled: updated.enabled,
      network: updated.network,
    });

    return NextResponse.json(
      {
        success: true,
        data: updated,
        testId: 'admin-blockchain-config-updated',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[UPDATE_BLOCKCHAIN_CONFIG_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update blockchain config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/blockchain-config
 * Alias para POST (atualizar)
 */
export async function PUT(req: NextRequest) {
  return POST(req);
}
