/**
 * @fileoverview API Route for Auctions CRUD operations
 * @description Create and list auctions for E2E testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auctions - List all auctions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId') || '1';

    const where: Record<string, unknown> = {
      tenantId: parseInt(tenantId)
    };

    if (status) {
      where.status = status;
    }

    const auctions = await prisma.auction.findMany({
      where,
      include: {
        Lot: {
          include: {
            Bid: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: auctions,
      count: auctions.length
    });
  } catch (error: unknown) {
    console.error('[API Auctions] Error listing auctions:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auctions - Create a new auction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      description,
      status = 'RASCUNHO',
      auctionDate,
      endDate,
      tenantId = 1
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Generate public ID
    const publicId = `auction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const auction = await prisma.auction.create({
      data: {
        publicId,
        slug,
        title,
        description,
        status,
        auctionDate: auctionDate ? new Date(auctionDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 60 * 1000),
        totalLots: 0,
        visits: 0,
        tenantId: parseInt(tenantId.toString())
      }
    });

    return NextResponse.json({
      success: true,
      data: auction,
      message: 'Auction created successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API Auctions] Error creating auction:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
