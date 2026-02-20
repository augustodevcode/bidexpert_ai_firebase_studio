/**
 * @fileoverview API Route for changing auction status
 * @description PATCH /api/auctions/[id]/status - Update auction status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/auctions/[id]/status - Update auction status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['RASCUNHO', 'ABERTO_PARA_LANCES', 'PREGAO', 'SOFT_CLOSE', 'ENCERRADO', 'CANCELADO'];
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Try to find by ID (numeric) or publicId
    let auction;
    const numericId = parseInt(id);
    
    if (!isNaN(numericId)) {
      auction = await prisma.auction.findUnique({
        where: { id: numericId }
      });
    }
    
    if (!auction) {
      auction = await prisma.auction.findFirst({
        where: {
          OR: [
            { publicId: id },
            { slug: id }
          ]
        }
      });
    }

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Update status
    const updatedAuction = await prisma.auction.update({
      where: { id: auction.id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // If closing auction, declare winners for lots with bids
    if (status === 'ENCERRADO') {
      const lots = await prisma.lot.findMany({
        where: {
          auctionId: auction.id,
          status: 'ABERTO'
        },
        include: {
          Bid: {
            where: { status: 'ATIVO' },
            orderBy: { amount: 'desc' },
            take: 1
          }
        }
      });

      for (const lot of lots) {
        if (lot.Bid.length > 0) {
          const winningBid = lot.Bid[0];
          
          // Update lot with winner
          await prisma.lot.update({
            where: { id: lot.id },
            data: {
              status: 'ARREMATADO',
              winnerId: winningBid.bidderId,
              price: winningBid.amount
            }
          });
        } else {
          // No bids, mark as nao_vendido
          await prisma.lot.update({
            where: { id: lot.id },
            data: {
              status: 'NAO_VENDIDO'
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedAuction,
      message: `Auction status updated to ${status}`
    });
  } catch (error: unknown) {
    console.error('[API Auction Status] Error updating status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
