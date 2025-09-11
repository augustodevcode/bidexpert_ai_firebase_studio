import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding full data...');

  const adminRole = await prisma.role.findUnique({ where: { name: 'Administrador' } });
  const bidderRole = await prisma.role.findUnique({ where: { name: 'Arrematante' } });

  if (!adminRole || !bidderRole) {
    throw new Error('Roles not found. Please run init-db first.');
  }

  // Seed Admin User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bidexpert.com' },
    update: {},
    create: {
      email: 'admin@bidexpert.com',
      password: hashedPassword,
      fullName: 'Admin User',
      habilitationStatus: 'HABILITADO',
      roles: {
        create: [{ roleId: adminRole.id, assignedBy: 'system' }],
      },
    },
  });

  // Seed Seller
  const seller = await prisma.seller.upsert({
    where: { name: 'Vendedor Padrão' },
    update: {},
    create: {
      name: 'Vendedor Padrão',
      email: 'seller@test.com',
    },
  });

  // Seed Auctioneer
  const auctioneer = await prisma.auctioneer.upsert({
    where: { name: 'Leiloeiro Padrão' },
    update: {},
    create: {
      name: 'Leiloeiro Padrão',
      email: 'auctioneer@test.com',
    },
  });

  // Seed Auction
  const auction = await prisma.auction.create({
    data: {
      title: 'Leilão de Veículos Usados',
      description: 'Grande oportunidade de adquirir seu veículo!',
      status: 'ABERTO_PARA_LANCES',
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
    },
  });

  // Seed Lot
  const vehicleCategory = await prisma.lotCategory.findUnique({ where: { slug: 'veiculos' } });
  await prisma.lot.create({
    data: {
      title: 'Carro Usado em Bom Estado',
      description: 'Carro de único dono, com baixa quilometragem.',
      price: 15000.00,
      initialPrice: 10000.00,
      status: 'ABERTO_PARA_LANCES',
      auctionId: auction.id,
      categoryId: vehicleCategory?.id,
      sellerId: seller.id,
      auctioneerId: auctioneer.id,
      type: 'veiculo',
    },
  });

  console.log('Finished seeding full data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
