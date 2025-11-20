// src/app/api/bidder/profile/route.ts
/**
 * @fileoverview API para gerenciar perfil do bidder
 */
import { NextRequest, NextResponse } from 'next/server';
import { bidderService } from '@/services/bidder.service';
import { getSession } from '@/server/lib/session';



export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const profile = await bidderService.getOrCreateBidderProfile(BigInt(userId));

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Error fetching bidder profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = session.userId;
    const result = await bidderService.updateBidderProfile(BigInt(userId), body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error updating bidder profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
