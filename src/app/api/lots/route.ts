/**
 * @fileoverview API Route for Lots CRUD operations
 * @description Create and list lots for E2E testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/lots - List all lots
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get('auctionId');
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId') || '1';

    const where: Record<string, unknown> = {
      tenantId: parseInt(tenantId)
    };

    if (auctionId) {
      const numericAuctionId = parseInt(auctionId);
      if (!isNaN(numericAuctionId)) {
        where.auctionId = numericAuctionId;
      } else {
        // Find auction by publicId or slug
        const auction = await prisma.auction.findFirst({
          where: {
            OR: [
              { publicId: auctionId },
              { slug: auctionId }
            ]
          }
        });
        if (auction) {
          where.auctionId = auction.id;
        }
      }
    }

    if (status) {
      where.status = status;
    }

    const lots = await prisma.lot.findMany({
      where,
      include: {
        Auction: {
          select: { id: true, title: true, status: true }
        },
        Bid: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: [{ number: 'asc' }, { createdAt: 'desc' }]
    });

    // Get highest bid for each lot
    const lotsWithHighestBid = await Promise.all(
      lots.map(async (lot) => {
        const highestBid = await prisma.bid.findFirst({
          where: { lotId: lot.id, status: 'ATIVO' },
          orderBy: { amount: 'desc' }
        });
        return {
          ...lot,
          highestBid: highestBid || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: lotsWithHighestBid,
      count: lotsWithHighestBid.length
    });
  } catch (error: unknown) {
    console.error('[API Lots] Error listing lots:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lots - Create a new lot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      auctionId,
      number,
      title,
      description,
      initialPrice,
      price,
      type = 'PRODUTO',
      condition = 'NOVO',
      status = 'EM_BREVE',
      tenantId = 1
    } = body;

    if (!title || !auctionId) {
      return NextResponse.json(
        { success: false, error: 'Title and auctionId are required' },
        { status: 400 }
      );
    }

    // Find auction by ID or publicId
    let auction;
    const numericAuctionId = parseInt(auctionId);
    
    if (!isNaN(numericAuctionId)) {
      auction = await prisma.auction.findUnique({
        where: { id: numericAuctionId }
      });
    }
    
    if (!auction) {
      auction = await prisma.auction.findFirst({
        where: {
          OR: [
            { publicId: auctionId },
            { slug: auctionId }
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

    // Generate slug and public ID
    const lotNumber = number || String(Date.now()).slice(-4);
    const slug = `${auction.slug || auction.id}-lote-${lotNumber}`;
    const publicId = `lot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const lot = await prisma.lot.create({
      data: {
        publicId,
        auctionId: auction.id,
        number: lotNumber,
        title,
        description: description || `Lote ${lotNumber} - ${title}`,
        slug,
        price: parseFloat(price || initialPrice || 0),
        initialPrice: parseFloat(initialPrice || price || 0),
        status,
        type,
        condition,
        bidsCount: 0,
        views: 0,
        isFeatured: false,
        tenantId: parseInt(tenantId.toString())
      }
    });

    // Update auction total lots count
    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        totalLots: { increment: 1 }
      }
    });

    return NextResponse.json({
      success: true,
      data: lot,
      message: 'Lot created successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API Lots] Error creating lot:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
