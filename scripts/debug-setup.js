// scripts/debug-setup.js
// Debug script to check platform settings and setup status

const { PrismaClient } = require('@prisma/client');

async function debugSetup() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking platform settings...');

    // Check if PlatformSettings table exists and has data
    const platformSettings = await prisma.platformSettings.findFirst();

    if (!platformSettings) {
      console.log('❌ No PlatformSettings found in database');
      console.log('💡 Run: npm run db:push && npm run db:seed');
      return;
    }

    console.log('✅ PlatformSettings found:', {
      id: platformSettings.id,
      isSetupComplete: platformSettings.isSetupComplete,
      createdAt: platformSettings.createdAt,
      updatedAt: platformSettings.updatedAt,
    });

    // Check specific field
    if (platformSettings.isSetupComplete === true) {
      console.log('✅ isSetupComplete is true - setup should work');
    } else if (platformSettings.isSetupComplete === false) {
      console.log('❌ isSetupComplete is false - will redirect to setup');
      console.log('💡 Update manually or run seed script');
    } else {
      console.log('❓ isSetupComplete is undefined/null - database schema issue');
      console.log('💡 Run: npx prisma db push');
    }

    // Check if there are users
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);

    // Check if there are tenants
    const tenantCount = await prisma.tenant.count();
    console.log(`🏢 Total tenants in database: ${tenantCount}`);

    // Check if there are auctions
    const auctionCount = await prisma.auction.count();
    console.log(`🏛️ Total auctions in database: ${auctionCount}`);

  } catch (error) {
    console.error('❌ Error checking setup:', error);
    console.log('💡 Possible solutions:');
    console.log('   1. Run: npx prisma db push');
    console.log('   2. Run: npm run db:seed');
    console.log('   3. Check .env file for database connection');
  } finally {
    await prisma.$disconnect();
  }
}

debugSetup();
