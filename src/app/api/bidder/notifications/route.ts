// src/app/api/bidder/notifications/route.ts
/**
 * @fileoverview API para gerenciar notificações do bidder
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
    const type = searchParams.get('type')?.split(',') as any;
    const isRead = searchParams.get('isRead');
    const search = searchParams.get('search');

    const userId = BigInt(session.user.id);
    const result = await bidderService.getBidderNotifications(userId, {
      page,
      limit,
      filters: {
        type,
        isRead: isRead ? isRead === 'true' : undefined,
        search
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
