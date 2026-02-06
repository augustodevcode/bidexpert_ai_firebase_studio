// src/app/api/audit/stats/route.ts
// API for fetching audit trail statistics

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

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      timestamp: { gte: startDate },
    };

    if (tenantId) {
      where.tenantId = BigInt(tenantId);
    }

    // Get statistics
    const [
      totalLogs,
      logsByModel,
      logsByAction,
      logsByUser,
      recentLogs,
    ] = await Promise.all([
      // Total count
      prisma.auditLog.count({ where }),

      // Logs by model
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
        orderBy: {
          _count: {
            entityType: 'desc',
          },
        },
        take: 10,
      }),

      // Logs by action
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),

      // Logs by user (top 10)
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),

      // Recent logs
      prisma.auditLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    // Format user statistics
    const userStats = await Promise.all(
      logsByUser.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { id: true, email: true, fullName: true },
        });
        return {
          userId: stat.userId.toString(),
          userName: user?.fullName || user?.email || 'Unknown',
          count: stat._count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLogs,
          period: `Last ${days} days`,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        byModel: logsByModel.map(item => ({
          model: item.entityType,
          count: item._count,
        })),
        byAction: logsByAction.map(item => ({
          action: item.action,
          count: item._count,
        })),
        byUser: userStats,
        recentLogs: recentLogs.map(log => ({
          id: log.id.toString(),
          userId: log.userId.toString(),
          userName: (log.User || (log as any).user)?.fullName || (log.User || (log as any).user)?.email,
          entityType: log.entityType,
          entityId: log.entityId.toString(),
          action: log.action,
          timestamp: log.timestamp.toISOString(),
        })),
      },
    });

  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
