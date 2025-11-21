
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const testId = 'auction-rj-1763656353596-1';
    
    console.log(`Testing auction lookup for: ${testId}`);
    
    // Test 1: Direct Prisma query
    const directResult = await prisma.auction.findFirst({
      where: {
        publicId: testId
      },
      include: {
        stages: true,
        lots: true
      }
    });
    
    console.log('\n=== Direct Prisma Query ===');
    if (directResult) {
      console.log(`✅ Found auction: ${directResult.title}`);
      console.log(`   ID: ${directResult.id}`);
      console.log(`   PublicId: ${directResult.publicId}`);
      console.log(`   Status: ${directResult.status}`);
      console.log(`   Stages: ${directResult.stages.length}`);
      console.log(`   Lots: ${directResult.lots.length}`);
      console.log(`   TenantId: ${directResult.tenantId}`);
    } else {
      console.log('❌ Auction not found');
    }
    
    // Test 2: With tenantId filter
    const withTenantResult = await prisma.auction.findFirst({
      where: {
        publicId: testId,
        tenantId: BigInt(1)
      },
      include: {
        stages: true
      }
    });
    
    console.log('\n=== With TenantId=1 Filter ===');
    if (withTenantResult) {
      console.log(`✅ Found auction: ${withTenantResult.title}`);
    } else {
      console.log('❌ Auction not found with tenantId=1');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
