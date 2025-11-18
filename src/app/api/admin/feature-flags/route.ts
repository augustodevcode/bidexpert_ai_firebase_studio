import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/get-tenant-id';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import logger from '@/lib/logger';

/**
 * GET /api/admin/feature-flags
 * Retorna os feature flags do tenant
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featureFlags = await PlatformSettingsService.getFeatureFlags(tenantId);

    return NextResponse.json(
      {
        success: true,
        data: {
          featureFlags,
          testId: 'admin-feature-flags-container',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[GET_FEATURE_FLAGS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get feature flags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 * Atualiza os feature flags do tenant
 */
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await PlatformSettingsService.updateFeatureFlags(tenantId, body);

    logger.info('[FEATURE_FLAGS_UPDATED]', {
      tenantId,
      changes: Object.keys(body),
    });

    return NextResponse.json(
      {
        success: true,
        data: updated,
        testId: 'admin-feature-flags-updated',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[UPDATE_FEATURE_FLAGS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update feature flags' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/feature-flags
 * Alias para POST (atualizar)
 */
export async function PUT(req: NextRequest) {
  return POST(req);
}
