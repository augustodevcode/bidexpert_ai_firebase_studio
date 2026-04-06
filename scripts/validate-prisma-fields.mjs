/**
 * Direct Prisma validation: confirms the auctionDate field error is fixed
 * by running the exact query that was failing before our fix.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('=== Prisma Field Validation ===\n');

  // Test 1: The exact query that was causing the runtime error
  // (bidding-eligibility.service.ts line ~187 before fix)
  console.log('Test 1: Lot.findFirst using lotSpecificAuctionDate (our fix)...');
  try {
    const lot = await prisma.lot.findFirst({
      select: {
        id: true,
        status: true,
        endDate: true,
        lotSpecificAuctionDate: true,  // ← FIXED: was "auctionDate" which caused the error
        initialPrice: true,
        tenantId: true,
      },
      take: 1,
    });
    console.log('✅ PASSED: lotSpecificAuctionDate query works. Lot:', lot ? `id=${lot.id}` : 'none found');
  } catch (e) {
    console.log('❌ FAILED:', e.message.split('\n')[0]);
  }

  // Test 2: Confirm the OLD broken approach would still fail (regression guard)
  console.log('\nTest 2: Confirm "auctionDate" on Lot still throws (expected failure)...');
  try {
    await prisma.lot.findFirst({
      select: {
        id: true,
        auctionDate: true, // This should throw "Unknown field"
      },
      take: 1,
    });
    console.log('❌ UNEXPECTED: Did not throw - the field "auctionDate" exists! Schema may have changed.');
  } catch (e) {
    if (e.message.includes('Unknown field') || e.message.includes('auctionDate') || e.code === 'P2009') {
      console.log('✅ CONFIRMED: "auctionDate" on Lot correctly throws -', e.message.split('\n')[0]);
    } else {
      console.log('⚠ Unexpected error type:', e.message.split('\n')[0]);
    }
  }

  // Test 3: AuctionStage without initialPrice
  console.log('\nTest 3: AuctionStage select WITHOUT initialPrice (our fix)...');
  try {
    const stage = await prisma.auctionStage.findFirst({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        discountPercent: true,
      },
      take: 1,
    });
    console.log('✅ PASSED: AuctionStage query (no initialPrice) works. Stage:', stage ? `id=${stage.id}` : 'none found');
  } catch (e) {
    console.log('❌ FAILED:', e.message.split('\n')[0]);
  }

  // Test 4: Confirm "initialPrice" on AuctionStage would fail
  console.log('\nTest 4: Confirm "initialPrice" on AuctionStage still throws (expected failure)...');
  try {
    await prisma.auctionStage.findFirst({
      select: {
        id: true,
        initialPrice: true, // This should throw
      },
      take: 1,
    });
    console.log('❌ UNEXPECTED: Did not throw - "initialPrice" may exist on AuctionStage now?');
  } catch (e) {
    if (e.message.includes('Unknown field') || e.message.includes('initialPrice') || e.code === 'P2009') {
      console.log('✅ CONFIRMED: "initialPrice" on AuctionStage correctly throws -', e.message.split('\n')[0]);
    } else {
      console.log('⚠ Unexpected error type:', e.message.split('\n')[0]);
    }
  }

  console.log('\n=== All checks complete ===');
  await prisma.$disconnect();
}

run().catch(async e => {
  console.error('FATAL:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
