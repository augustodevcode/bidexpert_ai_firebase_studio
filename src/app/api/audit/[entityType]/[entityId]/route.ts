// src/app/api/audit/[entityType]/[entityId]/route.ts
// API for fetching audit history for a specific entity

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseJsonField(value: unknown): Record<string, any> | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (typeof value === 'object') {
    return value as Record<string, any>;
  }

  return null;
}

function buildFieldChanges(log: any): any[] {
  const legacyChanges = parseJsonField(log.changes);
  const before = parseJsonField(log.oldValues) ?? legacyChanges?.before ?? null;
  const after = parseJsonField(log.newValues) ?? legacyChanges?.after ?? null;

  if (before || after) {
    return Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]))
      .filter((field) => JSON.stringify(before?.[field]) !== JSON.stringify(after?.[field]))
      .map((field) => ({
        propertyName: field,
        oldValue: before?.[field],
        newValue: after?.[field],
      }));
  }

  const fieldChanges: any[] = [];
  if (legacyChanges) {
    for (const [field, values] of Object.entries(legacyChanges)) {
      if (typeof values === 'object' && values !== null && 'old' in values && 'new' in values) {
        fieldChanges.push({
          propertyName: field,
          oldValue: (values as any).old,
          newValue: (values as any).new,
        });
      }
    }
  }

  return fieldChanges;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    // Get authenticated user
    const session = await auth();
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
          User: {
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
      const fieldChanges = buildFieldChanges(log);

      return {
        id: log.id.toString(),
        userId: log.userId.toString(),
        userName: (log.User || (log as any).user)?.fullName || (log.User || (log as any).user)?.email,
        userEmail: (log.User || (log as any).user)?.email,
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
