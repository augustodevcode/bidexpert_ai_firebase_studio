// src/app/api/audit/[entityType]/[entityId]/route.ts
// API for fetching audit history for a specific entity

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { entityType, entityId } = params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      entityType,
      entityId: BigInt(entityId),
    };

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
          timestamp: 'desc',
        },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format response with field-level changes
    const formattedLogs = logs.map(log => {
      const changes = log.changes ? (typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes) : null;
      
      // Extract field-level changes for display
      const fieldChanges: any[] = [];
      if (changes) {
        for (const [field, values] of Object.entries(changes)) {
          if (typeof values === 'object' && values !== null && 'old' in values && 'new' in values) {
            fieldChanges.push({
              propertyName: field,
              oldValue: (values as any).old,
              newValue: (values as any).new,
            });
          }
        }
      }

      return {
        id: log.id.toString(),
        userId: log.userId.toString(),
        userName: log.user.fullName || log.user.email,
        userEmail: log.user.email,
        modifiedOn: log.timestamp.toISOString(),
        operationType: log.action,
        changes: fieldChanges,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });

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
    console.error('Error fetching entity audit history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
