
import { PrismaClient } from '@prisma/client';
import { LotService } from '../src/services/lot.service';

const prisma = new PrismaClient();

async function main() {
  const lotService = new LotService();
  const auctionId = '155';
  const lotId = '511';
  const lotSlug = 'lote-teste-script-001';

  console.log('--- Debugging LotService ---');

  // 1. Get Tenant ID for the auction
  const auction = await prisma.auction.findUnique({
    where: { id: BigInt(auctionId) },
    select: { tenantId: true, status: true }
  });

  if (!auction) {
    console.error(`Auction ${auctionId} not found!`);
    return;
  }

  const tenantId = auction.tenantId.toString();
  console.log(`Auction ${auctionId} found. Tenant ID: ${tenantId}, Status: ${auction.status}`);

  // 2. Check Lot in DB directly
  const lotDB = await prisma.lot.findUnique({
    where: { id: BigInt(lotId) },
    include: { auction: true }
  });
  console.log(`Lot ${lotId} in DB:`, lotDB ? {
    id: lotDB.id,
    slug: lotDB.slug,
    publicId: lotDB.publicId,
    status: lotDB.status,
    tenantId: lotDB.tenantId,
    auctionId: lotDB.auctionId,
    auctionStatus: lotDB.auction.status
  } : 'Not Found');

  // 3. Test findLotById (internal)
  console.log('\n--- Testing findLotById (Internal) ---');
  const lotInternal = await lotService.findLotById(lotId, tenantId);
  console.log('Result:', lotInternal ? 'Found' : 'Not Found');

  // 4. Test getLotById (Public)
  console.log('\n--- Testing getLotById (Public) ---');
  const lotPublic = await lotService.getLotById(lotId, tenantId, true);
  console.log('Result (ID):', lotPublic ? 'Found' : 'Not Found');

  // 5. Test getLotById with Slug (Public)
  console.log('\n--- Testing getLotById with Slug (Public) ---');
  const lotPublicSlug = await lotService.getLotById(lotSlug, tenantId, true);
  console.log('Result (Slug):', lotPublicSlug ? 'Found' : 'Not Found');
  
  // 6. Test getLotDetailsForV2
  console.log('\n--- Testing getLotDetailsForV2 ---');
  const lotDetails = await lotService.getLotDetailsForV2(lotId);
  console.log('Result (Details):', lotDetails ? 'Found' : 'Not Found');

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
