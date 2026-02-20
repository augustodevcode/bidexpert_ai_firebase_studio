/**
 * @fileoverview API Route for Bids CRUD operations
 * @description Create and list bids for E2E testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bids - List all bids
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotId = searchParams.get('lotId');
    const auctionId = searchParams.get('auctionId');
    const bidderId = searchParams.get('bidderId');
    const tenantId = searchParams.get('tenantId') || '1';

    const where: Record<string, unknown> = {
      tenantId: parseInt(tenantId)
    };

    if (lotId) {
      const numericLotId = parseInt(lotId);
      if (!isNaN(numericLotId)) {
        where.lotId = numericLotId;
      } else {
        const lot = await prisma.lot.findFirst({
          where: { publicId: lotId }
        });
        if (lot) where.lotId = lot.id;
      }
    }

    if (auctionId) {
      const numericAuctionId = parseInt(auctionId);
      if (!isNaN(numericAuctionId)) {
        where.auctionId = numericAuctionId;
      } else {
        const auction = await prisma.auction.findFirst({
          where: {
            OR: [{ publicId: auctionId }, { slug: auctionId }]
          }
        });
        if (auction) where.auctionId = auction.id;
      }
    }

    if (bidderId) {
      const numericBidderId = parseInt(bidderId);
      if (!isNaN(numericBidderId)) {
        where.bidderId = numericBidderId;
      } else {
        const user = await prisma.user.findFirst({
          where: { publicId: bidderId }
        });
        if (user) where.bidderId = user.id;
      }
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        Lot: { select: { id: true, number: true, title: true } },
        User: { select: { id: true, name: true, email: true } }
      },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: bids,
      count: bids.length
    });
  } catch (error: unknown) {
    console.error('[API Bids] Error listing bids:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bids - Place a new bid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      lotId,
      bidderId,
      amount,
      tenantId = 1,
      isAutoBid = false,
      bidIncrement = 1000
    } = body;

    if (!lotId || !bidderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'lotId, bidderId and amount are required' },
        { status: 400 }
      );
    }

    // Find lot by ID or publicId
    let lot;
    const numericLotId = parseInt(lotId);
    
    if (!isNaN(numericLotId)) {
      lot = await prisma.lot.findUnique({
        where: { id: numericLotId }
      });
    }
    
    if (!lot) {
      lot = await prisma.lot.findFirst({
        where: { publicId: lotId }
      });
    }

    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'Lot not found' },
        { status: 404 }
      );
    }

    // Check if auction is open for bidding
    const auction = await prisma.auction.findUnique({
      where: { id: lot.auctionId }
    });

    if (!auction || !['ABERTO_PARA_LANCES', 'PREGAO', 'SOFT_CLOSE'].includes(auction.status)) {
      return NextResponse.json(
        { success: false, error: 'Auction is not open for bidding' },
        { status: 400 }
      );
    }

    // Find bidder by ID or email
    let bidder;
    const numericBidderId = parseInt(bidderId);
    
    if (!isNaN(numericBidderId)) {
      bidder = await prisma.user.findUnique({
        where: { id: numericBidderId }
      });
    }
    
    if (!bidder) {
      bidder = await prisma.user.findFirst({
        where: {
          OR: [
            { publicId: bidderId },
            { email: bidderId }
          ]
        }
      });
    }

    if (!bidder) {
      return NextResponse.json(
        { success: false, error: 'Bidder not found' },
        { status: 404 }
      );
    }

    // Get current highest bid
    const highestBid = await prisma.bid.findFirst({
      where: { lotId: lot.id, status: 'ATIVO' },
      orderBy: { amount: 'desc' }
    });

    const currentPrice = highestBid ? highestBid.amount : lot.initialPrice || lot.price;
    const minBidAmount = currentPrice + bidIncrement;

    // Validate bid amount
    if (amount < minBidAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Bid must be at least R$ ${minBidAmount.toLocaleString('pt-BR')}. Current price: R$ ${currentPrice.toLocaleString('pt-BR')}, minimum increment: R$ ${bidIncrement.toLocaleString('pt-BR')}` 
        },
        { status: 400 }
      );
    }

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        lotId: lot.id,
        auctionId: auction.id,
        bidderId: bidder.id,
        amount: parseFloat(amount),
        status: 'ATIVO',
        isAutoBid,
        tenantId: parseInt(tenantId.toString())
      }
    });

    // Update lot price and bid count
    await prisma.lot.update({
      where: { id: lot.id },
      data: {
        price: parseFloat(amount),
        bidsCount: { increment: 1 }
      }
    });

    // Update auction status if target reached (e.g., entering PREGAO phase)
    // This could be extended with more complex logic

    return NextResponse.json({
      success: true,
      data: bid,
      message: `Bid of R$ ${amount.toLocaleString('pt-BR')} placed successfully`,
      previousHighest: currentPrice,
      newHighest: amount
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API Bids] Error placing bid:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
