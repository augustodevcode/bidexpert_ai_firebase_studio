// src/app/api/bidder/dashboard/route.ts
/**
 * @fileoverview API para obter overview do dashboard do arrematante
 */
import { NextRequest, NextResponse } from 'next/server';
import { bidderService } from '@/services/bidder.service';
import { getSession } from '@/server/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const overview = await bidderService.getBidderDashboardOverview(userId);

    return NextResponse.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Error fetching bidder dashboard overview:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
