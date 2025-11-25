import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get recent query logs (last 50 queries)
    const queryLogs = await prisma.iTSM_QueryLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

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

    await prisma.iTSM_QueryLog.create({
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
