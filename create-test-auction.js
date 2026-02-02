
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAuction() {
  try {
    // Check if it exists
    const existing = await prisma.auction.findFirst({
      where: { title: { contains: 'Teste E2E' } }
    });

    if (existing) {
      console.log('Test Auction already exists:', existing.id);
      return existing.id;
    }

    // Create new
    const newAuction = await prisma.auction.create({
      data: {
        title: 'Leilão de Teste E2E Auto',
        slug: `teste-e2e-${Date.now()}`,
        status: 'RASCUNHO',
        auctionDate: new Date(),
        auctionType: 'JUDICIAL',
        auctionMethod: 'STANDARD',
        tenantId: '1', // Ensure it is created in Tenant 1 (Landlord)
        auctioneerId: '105', // Using the ID seen in previous check
        sellerId: '234'      // Using the ID seen in previous check
      }
    });
    console.log('Created Test Auction:', newAuction.id);
    return newAuction.id;
  } catch (e) {
    console.error('Error creating auction:', e);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAuction();
