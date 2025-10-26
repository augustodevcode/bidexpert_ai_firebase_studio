// src/app/api/bidder/won-lots/route.ts
/**
 * @fileoverview API para gerenciar lotes arrematados do bidder
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status')?.split(',') as any;
    const paymentStatus = searchParams.get('paymentStatus')?.split(',') as any;
    const search = searchParams.get('search');

    const userId = BigInt(session.user.id);
    const result = await bidderService.getBidderWonLots(userId, {
      page,
      limit,
      filters: {
        status,
        paymentStatus,
        search
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching won lots:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
