// src/app/api/bidder/won-lots/[id]/pay/route.ts
/**
 * @fileoverview API para processar pagamento de lote arrematado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { bidderService } from '@/services/bidder.service';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentMethodId, amount } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Método de pagamento é obrigatório' },
        { status: 400 }
      );
    }

    const userId = BigInt(session.user.id);
    const result = await bidderService.processWonLotPayment(
      userId,
      params.id,
      paymentMethodId,
      amount ? BigInt(amount) : undefined
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
