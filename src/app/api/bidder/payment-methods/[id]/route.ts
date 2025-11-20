// src/app/api/bidder/payment-methods/[id]/route.ts
/**
 * @fileoverview API para gerenciar método de pagamento específico
 */
import { NextRequest, NextResponse } from 'next/server';
import { bidderService } from '@/services/bidder.service';
import { getSession } from '@/server/lib/session';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.userId || !session?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX: Validate that payment method belongs to user's tenant
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        bidder: {
          include: {
            user: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Método de pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verify payment method belongs to the user
    if (paymentMethod.bidder.user.id.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await bidderService.updatePaymentMethod(params.id, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.userId || !session?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // ✅ SECURITY FIX: Validate that payment method belongs to user's tenant
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        bidder: {
          include: {
            user: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Método de pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verify payment method belongs to the user
    if (paymentMethod.bidder.user.id.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const result = await bidderService.deletePaymentMethod(params.id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
