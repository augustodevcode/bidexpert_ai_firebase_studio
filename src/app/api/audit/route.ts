// src/app/api/audit/route.ts
// Enhanced API for fetching audit logs with pagination, filtering, and role-based access

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Check user permissions
    const userRoles = (session.user as any).roles || [];
    const isAdmin = userRoles.some((role: string) => 
      ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(role)
    );

    // Build where clause
    const where: any = {};

    // Non-admins can only see their own audit logs
    if (!isAdmin) {
      where.userId = BigInt((session.user as any).id);
    } else if (userId) {
      where.userId = BigInt(userId);
    }

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = BigInt(entityId);
    if (action) where.action = action;
    if (tenantId) where.tenantId = BigInt(tenantId);

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Fetch logs with user information
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc',
        },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id.toString(),
      userId: log.userId.toString(),
      userName: log.user.fullName || log.user.email,
      userEmail: log.user.email,
      tenantId: log.tenantId?.toString(),
      entityType: log.entityType,
      entityId: log.entityId.toString(),
      action: log.action,
      changes: log.changes,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      location: log.location,
      timestamp: log.timestamp.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalRecords: totalCount,
      },
    });

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
