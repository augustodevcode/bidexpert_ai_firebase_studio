import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSimpleCounts() {
  try {
    console.log('Checking simple counts...');
    
    // Check just a few key tables to avoid timeout issues
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.count();
    const categories = await prisma.lotCategory.count();
    const assets = await prisma.asset.count();
    
    console.log(`Tenants: ${tenants}`);
    console.log(`Users: ${users}`);
    console.log(`Categories: ${categories}`);
    console.log(`Assets: ${assets}`);
    
  } catch (error) {
    console.error('Error checking counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSimpleCounts();