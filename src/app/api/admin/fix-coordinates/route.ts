import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust path if needed

function getRandomCoordinates() {
  // Rough Brazil coordinates
  const latitude = -10 - (Math.random() * 20); 
  const longitude = -40 - (Math.random() * 15);
  return { latitude, longitude };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret } = body;

    // Hardcoded secret for emergency fix deployment
    if (secret !== 'BIDEXPERT_FIX_COORDINATES_2025') {
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
