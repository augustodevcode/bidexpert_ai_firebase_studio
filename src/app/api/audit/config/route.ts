// src/app/api/audit/config/route.ts
// API for managing audit trail configuration

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditConfigService } from '@/services/audit-config.service';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    const config = await auditConfigService.getConfig(
      tenantId ? BigInt(tenantId) : undefined
    );

    return NextResponse.json({
      success: true,
      data: config,
    });

  } catch (error: any) {
    console.error('Error fetching audit config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRoles = (session.user as any).roles || [];
    const isAdmin = userRoles.some((role: string) => 
      ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(role)
    );

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tenantId, config } = body;

    const updatedConfig = await auditConfigService.updateConfig(
      config,
      tenantId ? BigInt(tenantId) : undefined
    );

    return NextResponse.json({
      success: true,
      data: updatedConfig,
    });

  } catch (error: any) {
    console.error('Error updating audit config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
