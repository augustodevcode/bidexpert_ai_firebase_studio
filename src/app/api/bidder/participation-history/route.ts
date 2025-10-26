// src/app/api/bidder/participation-history/route.ts
/**
 * @fileoverview API para obter histórico de participações do bidder
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { bidderService } from '@/services/bidder.service';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const result = searchParams.get('result')?.split(',') as any;
    const search = searchParams.get('search');

    const userId = BigInt(session.user.id);
    const history = await bidderService.getParticipationHistory(userId, {
      page,
      limit,
      filters: {
        result,
        search
      }
    });

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching participation history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
