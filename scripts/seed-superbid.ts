import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Superbid metadata seed...');

  try {
    const tenant = await prisma.tenant.findFirst({ where: { id: 1 } });
    if (!tenant) {
      console.error('Tenant ID 1 not found. Please run main seed first.');
      return;
    }

    const tenantId = tenant.id;
    console.log(`Tenant ID: ${tenantId}`);

    // 1. Ensure a Superbid Category exists
    console.log('Upserting LotCategory...');
    const superbidCategory = await prisma.lotCategory.upsert({
      where: { name: 'Superbid Veículos' },
      update: {},
      create: {
        name: 'Superbid Veículos',
        slug: `superbid-veiculos-${Date.now()}`,
        tenantId,
        description: 'Veículos provenientes da integração Superbid',
      },
    });
    console.log(`Category created: ${superbidCategory.id}`);

    const suffix = Date.now();

    // 2. Asset
    console.log('Creating Asset...');
    const asset = await prisma.asset.create({
      data: {
        publicId: `SB-A-${suffix}`,
        title: 'BMW 320i 2022',
        status: 'DISPONIVEL',
        tenantId,
        categoryId: superbidCategory.id,
        year: 2022,
        chassis: `CH-${suffix}`,
        plateFinal: '5',
      }
    });
    console.log(`Asset created: ${asset.id}`);

    // 3. Auction
    console.log('Creating Auction...');
    const auction = await prisma.auction.create({
      data: {
        publicId: `SB-AUC-${suffix}`,
        title: 'Leilão Superbid',
        status: 'ABERTO_PARA_LANCES',
        tenantId,
        openDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      }
    });
    console.log(`Auction created: ${auction.id}`);

    // 4. Lot
    console.log('Creating Lot...');
    const lot = await prisma.lot.create({
      data: {
        publicId: `SB-LOT-${suffix}`,
        number: `L-${suffix}`,
        title: 'BMW 320i',
        status: 'ABERTO_PARA_LANCES',
        auctionId: auction.id,
        tenantId,
        categoryId: superbidCategory.id,
        initialPrice: 100000,
        price: 100000,
        type: 'VEICULO',
        commissionRate: 5,
        platformFeeRate: 2.5,
        adminFee: 1500,
        logisticsFee: 500,
      }
    });
    console.log(`Lot created: ${lot.id}`);

    console.log('✅ Success!');
  } catch (error) {
    console.error('❌ SEED ERROR:');
    console.error(error);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
