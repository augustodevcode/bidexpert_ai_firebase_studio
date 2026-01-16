import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Clearing existing data...');

  // order matters for foreign keys
  await prisma.directSaleOffer.deleteMany().catch(() => { });
  await prisma.bid.deleteMany().catch(() => { });
  await prisma.userLotMaxBid.deleteMany().catch(() => { });
  await prisma.auctionHabilitation.deleteMany().catch(() => { });
  await prisma.review.deleteMany().catch(() => { });
  await prisma.lotQuestion.deleteMany().catch(() => { });
  await prisma.installmentPayment.deleteMany().catch(() => { });
  await prisma.userWin.deleteMany().catch(() => { });
  await prisma.notification.deleteMany().catch(() => { });

  await prisma.assetsOnLots.deleteMany().catch(() => { });
  await prisma.assetMedia.deleteMany().catch(() => { });
  await prisma.lotDocument.deleteMany().catch(() => { });
  await prisma.lotStagePrice.deleteMany().catch(() => { });
  await prisma.lotRisk.deleteMany().catch(() => { });
  await prisma.mediaItem.deleteMany().catch(() => { });

  await prisma.lot.deleteMany().catch(() => { });
  await prisma.auctionStage.deleteMany().catch(() => { });
  await prisma.auction.deleteMany().catch(() => { });
  await prisma.asset.deleteMany().catch(() => { });
  await prisma.judicialParty.deleteMany().catch(() => { });
  await prisma.judicialProcess.deleteMany().catch(() => { });

  await prisma.seller.deleteMany().catch(() => { });
  await prisma.auctioneer.deleteMany().catch(() => { });
  await prisma.subcategory.deleteMany().catch(() => { });
  await prisma.lotCategory.deleteMany().catch(() => { });
  await prisma.judicialBranch.deleteMany().catch(() => { });
  await prisma.judicialDistrict.deleteMany().catch(() => { });
  await prisma.court.deleteMany().catch(() => { });
  await prisma.city.deleteMany().catch(() => { });
  await prisma.state.deleteMany().catch(() => { });

  await prisma.usersOnRoles.deleteMany().catch(() => { });
  await prisma.usersOnTenants.deleteMany().catch(() => { });
  await prisma.userDocument.deleteMany().catch(() => { });
  await prisma.user.deleteMany().catch(() => { });
  await prisma.role.deleteMany().catch(() => { });
  await prisma.tenant.deleteMany().catch(() => { });

  console.log('Database cleared.');
}

async function main() {
  console.log('Starting database seeding...');

  if (process.env.RESET_DB === 'true') {
    await clearDatabase();
  } else {
    console.log('Skipping clearDatabase because RESET_DB != "true"');
  }

  const lordlandTenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Lordland Leilões',
      subdomain: 'lordland',
      domain: 'lordland.localhost',
    },
  });

  const bidexpertTenant = await prisma.tenant.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'BidExpert Marketplace',
      subdomain: 'marketplace',
      domain: 'marketplace.localhost',
    },
  });

  const allTenants = [lordlandTenant, bidexpertTenant];

  const rolesToCreate = [
    { name: 'ADMIN', nameNormalized: 'admin', description: 'Administrador do sistema', permissions: ['manage_all'] },
    {
      name: 'AUCTION_ANALYST',
      nameNormalized: 'auction_analyst',
      description: 'Analista de Leilões - Gerencia cadastros de leilões, lotes, bens e dados operacionais',
      permissions: [
        'auctions:create', 'auctions:read', 'auctions:update', 'auctions:delete', 'auctions:publish',
        'lots:create', 'lots:read', 'lots:update', 'lots:delete',
        'assets:create', 'assets:read', 'assets:update', 'assets:delete',
        'categories:create', 'categories:read', 'categories:update', 'categories:delete',
        'auctioneers:create', 'auctioneers:read', 'auctioneers:update', 'auctioneers:delete',
        'sellers:create', 'sellers:read', 'sellers:update', 'sellers:delete',
        'judicial_processes:create', 'judicial_processes:read', 'judicial_processes:update', 'judicial_processes:delete',
        'states:read', 'cities:read',
        'media:upload', 'media:read', 'media:update', 'media:delete',
        'view_reports',
      ]
    },
    { name: 'AUCTIONEER', nameNormalized: 'auctioneer', description: 'Leiloeiro', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'lots:finalize', 'conduct_auctions', 'view_reports'] },
    { name: 'SELLER', nameNormalized: 'seller', description: 'Vendedor/Comitente', permissions: ['auctions:manage_own', 'lots:manage_own', 'direct_sales:manage_own', 'consignor_dashboard:view', 'view_reports'] },
    { name: 'BIDDER', nameNormalized: 'bidder', description: 'Arrematante', permissions: ['view_auctions', 'view_lots', 'place_bids', 'direct_sales:place_proposal', 'direct_sales:buy_now', 'view_wins', 'manage_payments', 'schedule_retrieval'] },
  ];

  const createdRoles = await Promise.all(
    rolesToCreate.map(roleData =>
      prisma.role.upsert({
        where: { name: roleData.name },
        update: { permissions: roleData.permissions, description: roleData.description },
        create: roleData,
      })
    )
  );

  const hashedPassword = await bcrypt.hash('password123', 10);

  const auctionAnalystUser = await prisma.user.upsert({
    where: { email: 'analista@lordland.com' },
    update: {},
    create: {
      email: 'analista@lordland.com',
      password: hashedPassword,
      fullName: 'Analista de Leilões Lordland',
      tenants: {
        create: allTenants.map(t => ({ tenantId: t.id, assignedBy: 'seed' })),
      },
      roles: {
        create: { roleId: createdRoles.find(r => r.name === 'AUCTION_ANALYST')!.id, assignedBy: 'seed' },
      },
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lordland.com' },
    update: {},
    create: {
      email: 'admin@lordland.com',
      password: hashedPassword,
      fullName: 'Admin Lordland',
      tenants: { create: { tenantId: lordlandTenant.id, assignedBy: 'seed' } },
      roles: { create: { roleId: createdRoles.find(r => r.name === 'ADMIN')!.id, assignedBy: 'seed' } },
    },
  });

  const auctioneerUser = await prisma.user.upsert({
    where: { email: 'auctioneer@lordland.com' },
    update: {},
    create: {
      email: 'auctioneer@lordland.com',
      password: hashedPassword,
      fullName: 'Leiloeiro Lordland',
      tenants: { create: { tenantId: lordlandTenant.id, assignedBy: 'seed' } },
      roles: { create: { roleId: createdRoles.find(r => r.name === 'AUCTIONEER')!.id, assignedBy: 'seed' } },
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@lordland.com' },
    update: {},
    create: {
      email: 'seller@lordland.com',
      password: hashedPassword,
      fullName: 'Vendedor Lordland',
      tenants: { create: { tenantId: lordlandTenant.id, assignedBy: 'seed' } },
      roles: { create: { roleId: createdRoles.find(r => r.name === 'SELLER')!.id, assignedBy: 'seed' } },
    },
  });

  const bidderUser = await prisma.user.upsert({
    where: { email: 'bidder@lordland.com' },
    update: {},
    create: {
      email: 'bidder@lordland.com',
      password: hashedPassword,
      fullName: 'Arrematante Lordland',
      tenants: { create: { tenantId: lordlandTenant.id, assignedBy: 'seed' } },
      roles: { create: { roleId: createdRoles.find(r => r.name === 'BIDDER')!.id, assignedBy: 'seed' } },
    },
  });

  console.log('Main users created. Finishing seed...');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
