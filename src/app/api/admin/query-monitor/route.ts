import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isDev = process.env.NODE_ENV === 'development';
    const host = req.headers.get('host') || '';
    const isDemo = host.includes('demo') || host.includes('vercel.app');
    
    // Check if user is admin or bypassing in dev/demo
    if (!session?.user?.id && !isDev && !isDemo) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get recent query logs (last 100 queries)
    let queryLogs: any[] = [];
    try {
      // @ts-ignore - Handle prisma model name mismatch between databases
      const model = prisma.itsm_query_logs ?? prisma.iTSM_QueryLog;
      if (model) {
        queryLogs = await model.findMany({
          take: 100,
          orderBy: { timestamp: 'desc' },
          include: {
            User: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        });
      }
    } catch (modelError) {
      console.warn('Query monitor model not available:', modelError);
      // Return empty data if model doesn't exist
      return NextResponse.json({ queries: [], stats: { total: 0, avgDuration: 0, slowQueries: 0, failedQueries: 0 } });
    }

    // Calculate statistics
    const total = queryLogs.length;
    const avgDuration = total > 0 
      ? queryLogs.reduce((sum, log) => sum + log.duration, 0) / total 
      : 0;
    const slowQueries = queryLogs.filter(log => log.duration > 1000).length;
    const failedQueries = queryLogs.filter(log => !log.success).length;

    // Serialize data
    const serializedQueries = queryLogs.map(log => ({
      id: log.id.toString(),
      query: log.query,
      duration: log.duration,
      success: log.success,
      timestamp: log.timestamp,
      endpoint: log.endpoint,
      userId: log.userId?.toString() || null,
    }));

    return NextResponse.json({
      queries: serializedQueries,
      stats: {
        total,
        avgDuration: Math.round(avgDuration),
        slowQueries,
        failedQueries,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar logs de queries:', error);
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, duration, success, errorMessage, userId, endpoint, method, ipAddress } = body;

    // @ts-ignore
    await (prisma.itsm_query_logs || prisma.iTSM_QueryLog).create({
      data: {
        query,
        duration,
        success,
        errorMessage,
        userId: userId ? BigInt(userId) : null,
        endpoint,
        method,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar log de query:', error);
    return NextResponse.json({ error: 'Erro ao criar log' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const isDev = process.env.NODE_ENV === 'development';
    const host = req.headers.get('host') || '';
    const isDemo = host.includes('demo') || host.includes('vercel.app');
    
    // Check if user is admin or bypassing in dev/demo
    if (!session?.user?.id && !isDev && !isDemo) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
      // @ts-ignore
      await (prisma.itsm_query_logs ?? prisma.iTSM_QueryLog)?.deleteMany({});
    } catch (e) {
      console.warn('Cannot clear query logs - model may not exist:', e);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    return NextResponse.json({ error: 'Erro ao limpar logs' }, { status: 500 });
  }
}
