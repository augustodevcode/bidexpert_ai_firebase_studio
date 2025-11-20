
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Creating test auction...');

  // Find necessary relations
  const auctioneer = await prisma.auctioneer.findFirst();
  const seller = await prisma.seller.findFirst();
  const category = await prisma.lotCategory.findFirst({ where: { name: 'Veículos' } }) || await prisma.lotCategory.findFirst();

  const tenant = await prisma.tenant.findFirst();
  if (!auctioneer || !seller || !category || !tenant) {
    console.error('Missing required relations (Auctioneer, Seller, Category, or Tenant). Run seed first.');
    return;
  }

  const auction = await prisma.auction.create({
    data: {
      title: 'Leilão Teste Automático (Script)',
      description: 'Leilão criado via script para testes automatizados.',
      status: 'ABERTO',
      auctionType: 'JUDICIAL',
      participation: 'ONLINE',
      auctionMethod: 'STANDARD',
      categoryId: category.id,
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
      tenantId: BigInt(tenant.id),
      stages: {
        create: [
          {
            name: 'Praça 1',
            startDate: new Date(Date.now() - 3600000), // Started 1 hour ago
            endDate: new Date(Date.now() + 86400000 * 7), // Next week
            status: 'ABERTO'
          }
        ]
      },
      lots: {
        create: [
          {
            title: 'Lote Teste 001',
            description: 'Lote para teste de lances.',
            status: 'ABERTO_PARA_LANCES',
            price: 1000,
            bidIncrementStep: 100,
            categoryId: category.id,
            sellerId: seller.id,
            tenantId: BigInt(tenant.id),
            number: '001',
            type: 'VEICULO',
            slug: 'lote-teste-script-001',
            publicId: 'LOTE-SCRIPT-001'
          }
        ]
      }
    },
    include: {
      lots: true
    }
  });

  console.log(`Auction created successfully: ${auction.title} (ID: ${auction.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
