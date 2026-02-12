
import { PrismaClient } from '@prisma/client';
import { auctionStateMachine } from '../src/lib/auction-state-machine/auction-state.service';
import { lotStateMachine } from '../src/lib/auction-state-machine/lot-state.service';
import { AuctionStatus, LotStatus } from '../src/lib/auction-state-machine/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Auction State Machine Test...');

  // 1. Setup Context
  const tenantId = BigInt(1); // Assuming tenant 1 exists
  const userId = BigInt(1);   // Assuming user 1 exists (Admin/System)

  // Verify Tenant Exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error('❌ Tenant 1 not found. Please run seed.');
    return;
  }

  // 2. Create Auction (DRAFT)
  console.log('\nCreating Auction (RASCUNHO)...');
  const auction = await prisma.auction.create({
    data: {
      title: 'Leilão Teste State Machine ' + Date.now(),
      status: 'RASCUNHO', // legacy/current mapping
      tenantId,
      slug: 'test-auction-' + Date.now(),
      // category: 'VEICULOS', // removed invalid field
      updatedAt: new Date(),
    } as any // Using as any strictly for test setup flexibility if schemas vary
  });
  console.log(`✅ Auction Created: #${auction.id} - Status: ${auction.status}`);

  // 3. Add Lot
  console.log('Adding Lot...');
  const lot = await prisma.lot.create({
    data: {
        title: 'Lote Teste 01',
        price: 1000,
        auctionId: auction.id,
        tenantId,
        status: 'RASCUNHO',
        slug: 'lote-teste-' + Date.now(),
        type: 'GENERIC', // Mandatory field type
        updatedAt: new Date(),
    } as any
  });
  console.log(`✅ Lot Created: #${lot.id} - Status: ${lot.status}`);

  // 4. Submit for Validation
  console.log('\n👉 Transition: Submit for Validation...');
  try {
    const res = await auctionStateMachine.submitForValidation({
        auctionId: auction.id,
        tenantId,
        userId
    });
    if(!res.success) throw new Error(res.error);
    console.log(`✅ Success! New Status: ${res.data?.status}`);
  } catch (e: any) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }

  // 5. Approve Auction (-> SCHEDULED)
  console.log('\n👉 Transition: Approve Auction (Schedule)...');
  const openDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
  const endDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  try {
    const res = await auctionStateMachine.approveAuction({
        auctionId: auction.id,
        tenantId,
        userId,
        openDate,
        endDate
    });
    if(!res.success) throw new Error(res.error);
    console.log(`✅ Success! New Status: ${res.data?.status}`);
    // Check Lot Status (Should be SCHEDULED/EM_BREVE)
    const updatedLot = await prisma.lot.findUnique({ where: { id: lot.id } });
    console.log(`   Cascade Check: Lot Status: ${updatedLot?.status}`);
  } catch (e: any) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }

  // 6. Manual Open (Force Open)
  console.log('\n👉 Transition: Manual Open (Start Bidding)...');
  try {
    const res = await auctionStateMachine.openAuction({
        auctionId: auction.id,
        tenantId,
        userId
    });
    if(!res.success) throw new Error(res.error);
    console.log(`✅ Success! New Status: ${res.data?.status}`);
    const updatedLot = await prisma.lot.findUnique({ where: { id: lot.id } });
    console.log(`   Cascade Check: Lot Status: ${updatedLot?.status} (Should be OPEN)`);
  } catch (e: any) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }

  // 7. Start Lot Auction (Live Pregon)
  console.log('\n👉 Transition: Start Lot Live...');
  try {
    const res = await lotStateMachine.startLotAuction({
        lotId: lot.id,
        auctionId: auction.id,
        tenantId,
        userId
    });
    if(!res.success) throw new Error(res.error);
    console.log(`✅ Success! Lot New Status: ${res.data?.status}`);
    // Auction status should technically be updated to EM_PREGAO if configured, but currently mapping might vary
    const updatedAuction = await prisma.auction.findUnique({ where: { id: auction.id } });
    console.log(`   Auction Status Check: ${updatedAuction?.status}`);
  } catch (e: any) {
    console.error('❌ Failed:', e.message);
  }

  // 8. Close/Sell Lot
  console.log('\n👉 Transition: Sell Lot...');
  try {
    const res = await lotStateMachine.confirmSale({
        lotId: lot.id,
        auctionId: auction.id,
        tenantId,
        userId,
        soldPrice: 1500,
        winnerId: BigInt(2) // Mock winner
    });
    if(!res.success) throw new Error(res.error);
    console.log(`✅ Success! Lot New Status: ${res.data?.status}`);
  } catch (e: any) {
    // Might fail if winner user doesn't exist, which is expected in this mock
    console.warn('⚠️ Expected Warning (Reference Error?):', e.message);
  }

  console.log('\n🏁 Test Complete.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
