// src/app/api/bidder/dashboard/route.ts
/**
 * @fileoverview API para obter overview do dashboard do arrematante
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

    const userId = BigInt(session.user.id);
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
