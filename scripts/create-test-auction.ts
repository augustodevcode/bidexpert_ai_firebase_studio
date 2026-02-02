
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = [BigInt(1), BigInt(3)]; // Create for both potential login tenants

  for (const tenantId of tenants) {
    try {
        console.log(`Ensuring data for Tenant ${tenantId}...`);
    // 1. Create Auctioneer
    const auctioneer = await prisma.auctioneer.upsert({
      where: { id: BigInt(900000 + Number(tenantId)) }, // Unique ID per tenant
      update: {},
      create: {
        id: BigInt(900000 + Number(tenantId)),
        tenantId: tenantId,
        publicId: `auct-test-${tenantId}`,
        slug: `leiloeiro-teste-e2e-${tenantId}`,
        name: `Leiloeiro Teste E2E (T${tenantId})`,
        email: `leiloeiro${tenantId}@teste.com`,
        phone: '11999999999',
        registrationNumber: '123/2024',
        updatedAt: new Date(),
      }
    });

    // 2. Create Auction
    const auction = await prisma.auction.upsert({
      where: { id: BigInt(800000 + Number(tenantId)) },
      update: {
        status: 'ABERTO', 
        title: `Leilão de Teste E2E - Auditoria (T${tenantId})`,
        slug: `leilao-de-teste-e2e-auditoria-${tenantId}`,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      },
      create: {
        id: BigInt(800000 + Number(tenantId)),
        tenantId: tenantId,
        auctioneerId: auctioneer.id,
        title: `Leilão de Teste E2E - Auditoria (T${tenantId})`,
        slug: `leilao-de-teste-e2e-auditoria-${tenantId}`,
        description: 'Descrição completa do leilão de teste',
        status: 'ABERTO',
        auctionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        zipCode: '01001-000',
        address: 'Rua de Teste, 123',
      }
    });
    console.log('Auction created:', auction.title);
    } catch (e) { console.error(`Error for tenant ${tenantId}:`, e); }
  }
  
  await prisma.$disconnect();
}

main();
