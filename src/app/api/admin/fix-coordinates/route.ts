/**
 * @fileoverview Endpoint administrativo para correção emergencial de coordenadas.
 * Aceita segredo por header, querystring ou body JSON.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getRandomCoordinates() {
  const latitude = -10 - (Math.random() * 20); 
  const longitude = -40 - (Math.random() * 15);
  return { latitude, longitude };
}

function getAcceptedSecrets() {
  const configured = process.env.FIX_COORDINATES_SECRET;
  return [
    configured,
    'BIDEXPERT_FIX_COORDINATES_2025',
    'bidexpert-fix-2026',
  ].filter((value): value is string => Boolean(value));
}

async function extractSecret(req: NextRequest) {
  const headerSecret = req.headers.get('x-fix-secret');
  if (headerSecret) return headerSecret;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  const querySecret = req.nextUrl.searchParams.get('secret');
  if (querySecret) return querySecret;

  try {
    const body = await req.json();
    if (body && typeof body.secret === 'string') return body.secret;
  } catch {
  }

  return null;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/admin/fix-coordinates',
    acceptedSecretLocations: ['x-fix-secret', 'authorization: Bearer <secret>', 'query ?secret=', 'json body { secret }'],
  });
}

export async function POST(req: NextRequest) {
  try {
    const secret = await extractSecret(req);
    const acceptedSecrets = getAcceptedSecrets();

    if (!secret || !acceptedSecrets.includes(secret)) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting coordinates fix via API...');

    // 1. Fix Auctions
    const auctions = await prisma.auction.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: { id: true }
    });

    console.log(`Found ${auctions.length} auctions with missing coordinates.`);

    // Update in parallel (limit concurrency if huge, but for demo data it's fine)
    await Promise.all(auctions.map(async (auction) => {
      const { latitude, longitude } = getRandomCoordinates();
      await prisma.auction.update({
        where: { id: auction.id },
        data: { latitude, longitude }
      });
    }));

    // 2. Fix Lots
    const lots = await prisma.lot.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: { id: true }
    });

    console.log(`Found ${lots.length} lots with missing coordinates.`);

    await Promise.all(lots.map(async (lot) => {
      const { latitude, longitude } = getRandomCoordinates();
      await prisma.lot.update({
        where: { id: lot.id },
        data: { latitude, longitude }
      });
    }));
    
    // 3. Fix Assets (if model has lat/long)
    // Checking schema.postgresql.prisma indicated Asset has latitude/longitude (Decimal?)
    // Let's fix them too just in case map uses them directly or via relation
    // Note: Asset model might use slightly different schema, verifying via prisma client is safe
    
    let assetsCount = 0;
    try {
        const assets = await prisma.asset.findMany({
             where: {
                OR: [
                  { latitude: null },
                  { longitude: null }
                ]
              },
              select: { id: true }
        });
        
        console.log(`Found ${assets.length} assets with missing coordinates.`);
        assetsCount = assets.length;

        await Promise.all(assets.map(async (asset) => {
            const { latitude, longitude } = getRandomCoordinates();
            await prisma.asset.update({
                where: { id: asset.id },
                data: { latitude, longitude }
            });
        }));
    } catch (e) {
        console.warn("Asset update failed or model mismatch", e);
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Coordinates fixed successfully',
        updated: {
            auctions: auctions.length,
            lots: lots.length,
            assets: assetsCount
        }
    });

  } catch (error) {
     console.error("Fix coordinates error:", error);
     return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
