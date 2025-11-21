import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Clearing existing data...');
  // Delete in order of dependency to avoid foreign key constraints
  await prisma.usersOnRoles.deleteMany();
  await prisma.usersOnTenants.deleteMany();
  await prisma.lotStagePrice.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.userLotMaxBid.deleteMany();
  await prisma.auctionHabilitation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lotQuestion.deleteMany();
  await prisma.installmentPayment.deleteMany();
  await prisma.userWin.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.assetMedia.deleteMany();
  await prisma.assetsOnLots.deleteMany();
  await prisma.userDocument.deleteMany();
  await prisma.themeColors.deleteMany();
  await prisma.themeSettings.deleteMany();
  await prisma.idMasks.deleteMany();
  await prisma.variableIncrementRule.deleteMany();
  await prisma.mapSettings.deleteMany();
  await prisma.biddingSettings.deleteMany();
  await prisma.paymentGatewaySettings.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.mentalTriggerSettings.deleteMany();
  await prisma.sectionBadgeVisibility.deleteMany();
  await prisma.platformSettings.deleteMany();
  await prisma.judicialParty.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.auctionStage.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.judicialProcess.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.auctioneer.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.lotCategory.deleteMany();
  await prisma.judicialBranch.deleteMany();
  await prisma.judicialDistrict.deleteMany();
  await prisma.court.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.directSaleOffer.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.report.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.vehicleMake.deleteMany();
  await prisma.bidderProfile.deleteMany();
  await prisma.wonLot.deleteMany();
  await prisma.bidderNotification.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.participationHistory.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.counterState.deleteMany();

  console.log('Database cleared.');
}

async function main() {
  console.log('Starting database seeding...');

  await clearDatabase();

  // 2. Criação do Tenant e Configurações da Plataforma
  const lordlandTenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Lordland',
      slug: 'lordland',
      // Adicione outros campos obrigatórios do Tenant aqui
    },
  });
  console.log(`Created/Updated Tenant: ${lordlandTenant.name}`);

  // 3. Criação de Usuários com diferentes perfis (Admin, Leiloeiro, Comitente, Arrematante).
  // Criação de Roles
  const rolesToCreate = [
    { name: 'ADMIN', nameNormalized: 'admin', description: 'Administrador do sistema' },
    { name: 'AUCTIONEER', nameNormalized: 'auctioneer', description: 'Leiloeiro' },
    { name: 'SELLER', nameNormalized: 'seller', description: 'Vendedor/Comitente' },
    { name: 'BIDDER', nameNormalized: 'bidder', description: 'Arrematante' },
  ];

  const createdRoles = await Promise.all(
    rolesToCreate.map(roleData =>
      prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: roleData,
      })
    )
  );
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Clearing existing data...');
  // Delete in order of dependency to avoid foreign key constraints
  await prisma.usersOnRoles.deleteMany();
  await prisma.usersOnTenants.deleteMany();
  await prisma.lotStagePrice.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.userLotMaxBid.deleteMany();
  await prisma.auctionHabilitation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lotQuestion.deleteMany();
  await prisma.installmentPayment.deleteMany();
  await prisma.userWin.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.assetMedia.deleteMany();
  await prisma.assetsOnLots.deleteMany();
  await prisma.userDocument.deleteMany();
  await prisma.themeColors.deleteMany();
  await prisma.themeSettings.deleteMany();
  await prisma.idMasks.deleteMany();
  await prisma.variableIncrementRule.deleteMany();
  await prisma.mapSettings.deleteMany();
  await prisma.biddingSettings.deleteMany();
  await prisma.paymentGatewaySettings.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.mentalTriggerSettings.deleteMany();
  await prisma.sectionBadgeVisibility.deleteMany();
  await prisma.platformSettings.deleteMany();
  await prisma.judicialParty.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.auctionStage.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.judicialProcess.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.auctioneer.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.lotCategory.deleteMany();
  await prisma.judicialBranch.deleteMany();
  await prisma.judicialDistrict.deleteMany();
  await prisma.court.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.directSaleOffer.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.report.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.vehicleMake.deleteMany();
  await prisma.bidderProfile.deleteMany();
  await prisma.wonLot.deleteMany();
  await prisma.bidderNotification.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.participationHistory.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.documentTemplate.deleteMany();

  console.log('Database cleared.');
}

async function main() {
  console.log('Starting database seeding...');

  await clearDatabase();

  // 2. Criação do Tenant e Configurações da Plataforma
  const lordlandTenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Lordland',
      slug: 'lordland',
      // Adicione outros campos obrigatórios do Tenant aqui
    },
  });
  console.log(`Created/Updated Tenant: ${lordlandTenant.name}`);

  // 3. Criação de Usuários com diferentes perfis (Admin, Leiloeiro, Comitente, Arrematante).
  // Criação de Roles
  const rolesToCreate = [
    { name: 'ADMIN', nameNormalized: 'admin', description: 'Administrador do sistema' },
    { name: 'AUCTIONEER', nameNormalized: 'auctioneer', description: 'Leiloeiro' },
    { name: 'SELLER', nameNormalized: 'seller', description: 'Vendedor/Comitente' },
    { name: 'BIDDER', nameNormalized: 'bidder', description: 'Arrematante' },
  ];

  const createdRoles = await Promise.all(
    rolesToCreate.map(roleData =>
      prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: roleData,
      })
    )
  );
  console.log(`Created/Updated Roles: ${createdRoles.map(r => r.name).join(', ')}`);

  // Criação de Usuários
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lordland.com' },
    update: {},
    create: {
      email: 'admin@lordland.com',
      password: hashedPassword,
      fullName: 'Admin Lordland',
      // Outros campos do usuário
      tenants: {
        create: { tenantId: lordlandTenant.id, assignedBy: 'seed' },
      },
      roles: {
        create: { roleId: createdRoles.find(r => r.name === 'ADMIN')!.id, assignedBy: 'seed' },
      },
    },
  });
  console.log(`Created/Updated Admin User: ${adminUser.email}`);

  const auctioneerUser = await prisma.user.upsert({
    where: { email: 'auctioneer@lordland.com' },
    update: {},
    create: {
      email: 'auctioneer@lordland.com',
      password: hashedPassword,
      fullName: 'Leiloeiro Lordland',
      tenants: {
        create: { tenantId: lordlandTenant.id, assignedBy: 'seed' },
      },
      roles: {
        create: { roleId: createdRoles.find(r => r.name === 'AUCTIONEER')!.id, assignedBy: 'seed' },
      },
    },
  });
  console.log(`Created/Updated Auctioneer User: ${auctioneerUser.email}`);

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@lordland.com' },
    update: {},
    create: {
      email: 'seller@lordland.com',
      password: hashedPassword,
      fullName: 'Vendedor Lordland',
      tenants: {
        create: { tenantId: lordlandTenant.id, assignedBy: 'seed' },
      },
      roles: {
        create: { roleId: createdRoles.find(r => r.name === 'SELLER')!.id, assignedBy: 'seed' },
      },
    },
  });
  console.log(`Created/Updated Seller User: ${sellerUser.email}`);

  const bidderUser = await prisma.user.upsert({
    where: { email: 'bidder@lordland.com' },
    update: {},
    create: {
      email: 'bidder@lordland.com',
      password: hashedPassword,
      fullName: 'Arrematante Lordland',
      tenants: {
        create: { tenantId: lordlandTenant.id, assignedBy: 'seed' },
      },
      roles: {
        create: { roleId: createdRoles.find(r => r.name === 'BIDDER')!.id, assignedBy: 'seed' },
      },
    },
  });
  console.log(`Created/Updated Bidder User: ${bidderUser.email}`);

  // 4. Criação das entidades judiciais e de localização
  const stateSP = await prisma.state.upsert({
    where: { uf: 'SP' },
    update: {},
    create: {
      name: 'São Paulo',
      uf: 'SP',
      slug: 'sao-paulo',
    },
  });
  console.log(`Created/Updated State: ${stateSP.name}`);

  const citySP = await prisma.city.upsert({
    where: { name_stateId: { name: 'São Paulo', stateId: stateSP.id } },
    update: {},
    create: {
      name: 'São Paulo',
      stateId: stateSP.id,
      slug: 'sao-paulo',
      ibgeCode: '3550308',
    },
  });
  console.log(`Created/Updated City: ${citySP.name}`);

  const courtSP = await prisma.court.upsert({
    where: { slug: 'tj-sp' },
    update: {},
    create: {
      name: 'Tribunal de Justiça de São Paulo',
      slug: 'tj-sp',
      stateUf: 'SP',
      website: 'www.tjsp.jus.br',
    },
  });
  console.log(`Created/Updated Court: ${courtSP.name}`);

  const judicialDistrictSP = await prisma.judicialDistrict.upsert({
    where: { slug: 'comarca-sp' },
    update: {},
    create: {
      name: 'Comarca de São Paulo',
      slug: 'comarca-sp',
      courtId: courtSP.id,
      stateId: stateSP.id,
    },
  });
  console.log(`Created/Updated Judicial District: ${judicialDistrictSP.name}`);

  const judicialBranchSP = await prisma.judicialBranch.upsert({
    where: { slug: 'vara-civel-sp' },
    update: {},
    create: {
      name: '1ª Vara Cível de São Paulo',
      slug: 'vara-civel-sp',
      districtId: judicialDistrictSP.id,
      contactName: 'Secretaria da Vara',
      phone: '(11) 98765-4321',
      email: 'vara1civel@tjsp.jus.br',
    },
  });
  console.log(`Created/Updated Judicial Branch: ${judicialBranchSP.name}`);

  // 5. Criação de Comitentes e Leiloeiros
  const sellerUser = await prisma.user.findUnique({ where: { email: 'seller@lordland.com' } });
  const auctioneerUser = await prisma.user.findUnique({ where: { email: 'auctioneer@lordland.com' } });

  const judicialSeller = await prisma.seller.upsert({
    where: { slug: 'vendedor-judicial-sp' },
    update: {},
    create: {
      publicId: 'SELLER-JUD-SP',
      name: 'Vendedor Judicial SP',
      slug: 'vendedor-judicial-sp',
      isJudicial: true,
      judicialBranchId: judicialBranchSP.id,
      tenantId: lordlandTenant.id,
      userId: sellerUser?.id,
    },
  });
  console.log(`Created/Updated Judicial Seller: ${judicialSeller.name}`);

  const extrajudicialSeller = await prisma.seller.upsert({
    where: { slug: 'vendedor-extrajudicial-sp' },
    update: {},
    create: {
      publicId: 'SELLER-EXT-SP',
      name: 'Vendedor Extrajudicial SP',
      slug: 'vendedor-extrajudicial-sp',
      isJudicial: false,
      tenantId: lordlandTenant.id,
      userId: sellerUser?.id,
    },
  });
  console.log(`Created/Updated Extrajudicial Seller: ${extrajudicialSeller.name}`);

  const mainAuctioneer = await prisma.auctioneer.upsert({
    where: { slug: 'leiloeiro-principal' },
    update: {},
    create: {
      publicId: 'AUCT-MAIN',
      name: 'Leiloeiro Principal',
      slug: 'leiloeiro-principal',
      registrationNumber: '12345',
      tenantId: lordlandTenant.id,
      userId: auctioneerUser?.id,
    },
  });
  console.log(`Created/Updated Main Auctioneer: ${mainAuctioneer.name}`);

  // 6. Criação de Categorias e Subcategorias de lotes.
  const categoryImoveis = await prisma.lotCategory.upsert({
    where: { slug: 'imoveis' },
    update: {},
    create: {
      name: 'Imóveis',
      slug: 'imoveis',
      description: 'Lotes de imóveis diversos',
      hasSubcategories: true,
    },
  });
  console.log(`Created/Updated Category: ${categoryImoveis.name}`);

  const subcategoryApartamentos = await prisma.subcategory.upsert({
    where: { slug: 'apartamentos' },
    update: {},
    create: {
      name: 'Apartamentos',
      slug: 'apartamentos',
      parentCategoryId: categoryImoveis.id,
      description: 'Apartamentos residenciais e comerciais',
    },
  });
  console.log(`Created/Updated Subcategory: ${subcategoryApartamentos.name}`);

  const categoryVeiculos = await prisma.lotCategory.upsert({
    where: { slug: 'veiculos' },
    update: {},
    create: {
      name: 'Veículos',
      slug: 'veiculos',
      description: 'Lotes de veículos automotores',
      hasSubcategories: true,
    },
  });
  console.log(`Created/Updated Category: ${categoryVeiculos.name}`);

  const subcategoryCarros = await prisma.subcategory.upsert({
    where: { slug: 'carros' },
    update: {},
    create: {
      name: 'Carros',
      slug: 'carros',
      parentCategoryId: categoryVeiculos.id,
      description: 'Carros de passeio, utilitários, etc.',
    },
  });
  console.log(`Created/Updated Subcategory: ${subcategoryCarros.name}`);

  // 7. Criação de Processos Judiciais e Ativos (Bens) de diversos tipos.
  const judicialProcess = await prisma.judicialProcess.upsert({
    where: { processNumber: '1234567-89.2023.8.26.0001' },
    update: {},
    create: {
      publicId: 'PROC-JUD-001',
      processNumber: '1234567-89.2023.8.26.0001',
      isElectronic: true,
      tenantId: lordlandTenant.id,
      courtId: courtSP.id,
      districtId: judicialDistrictSP.id,
      branchId: judicialBranchSP.id,
      sellerId: judicialSeller.id,
      parties: {
        create: [
          { name: 'João da Silva', partyType: 'AUTOR' },
          { name: 'Maria Souza', partyType: 'REU' },
        ],
      },
    },
  });
  console.log(`Created/Updated Judicial Process: ${judicialProcess.processNumber}`);

  const assetImovel = await prisma.asset.upsert({
    where: { publicId: 'ASSET-IMOVEL-001' },
    update: {},
    create: {
      publicId: 'ASSET-IMOVEL-001',
      title: 'Apartamento em Pinheiros',
      description: 'Apartamento de 100m² com 3 quartos e 2 banheiros.',
      status: 'DISPONIVEL',
      categoryId: categoryImoveis.id,
      subcategoryId: subcategoryApartamentos.id,
      judicialProcessId: judicialProcess.id,
      sellerId: judicialSeller.id,
      tenantId: lordlandTenant.id,
      evaluationValue: 500000.00,
      propertyRegistrationNumber: '123456',
      iptuNumber: '789012',
      isOccupied: false,
      totalArea: 100.00,
      builtArea: 90.00,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
    },
  });
  console.log(`Created/Updated Asset: ${assetImovel.title}`);

  const assetVeiculo = await prisma.asset.upsert({
    where: { publicId: 'ASSET-VEICULO-001' },
    update: {},
    create: {
      publicId: 'ASSET-VEICULO-001',
      title: 'Carro Fiat Palio 2015',
      description: 'Fiat Palio Fire, ano 2015, em bom estado de conservação.',
      status: 'DISPONIVEL',
      categoryId: categoryVeiculos.id,
      subcategoryId: subcategoryCarros.id,
      judicialProcessId: judicialProcess.id,
      sellerId: judicialSeller.id,
      tenantId: lordlandTenant.id,
      evaluationValue: 30000.00,
      plate: 'ABC1234',
      make: 'Fiat',
      model: 'Palio',
      year: 2015,
      modelYear: 2015,
      fuelType: 'Flex',
      color: 'Prata',
      vin: '9BWZZZ123F4567890',
      renavam: '12345678901',
    },
  });
  console.log(`Created/Updated Asset: ${assetVeiculo.title}`);

  // 8. Criação de Leilões (judiciais e extrajudiciais) com suas Etapas.
  const judicialAuction = await prisma.auction.upsert({
    where: { slug: 'leilao-judicial-sp-001' },
    update: {},
    create: {
      publicId: 'LEILAO-JUD-001',
      slug: 'leilao-judicial-sp-001',
      title: 'Leilão Judicial de Imóveis e Veículos',
      description: 'Leilão de bens provenientes de processo judicial.',
      status: 'EM_PREPARACAO',
      auctionDate: new Date('2025-11-15T10:00:00Z'),
      endDate: new Date('2025-11-20T18:00:00Z'),
      auctionType: 'JUDICIAL',
      auctionMethod: 'STANDARD',
      tenantId: lordlandTenant.id,
      auctioneerId: mainAuctioneer.id,
      sellerId: judicialSeller.id,
      judicialProcessId: judicialProcess.id,
      cityId: citySP.id,
      stateId: stateSP.id,
      stages: {
        create: [
          {
            name: 'Primeira Praça',
            startDate: new Date('2025-11-15T10:00:00Z'),
            endDate: new Date('2025-11-17T10:00:00Z'),
            initialPrice: 500000.00,
          },
          {
            name: 'Segunda Praça',
            startDate: new Date('2025-11-17T10:01:00Z'),
            endDate: new Date('2025-11-20T18:00:00Z'),
            initialPrice: 250000.00,
          },
        ],
      },
    },
  });
  console.log(`Created/Updated Judicial Auction: ${judicialAuction.title}`);

  const extrajudicialAuction = await prisma.auction.upsert({
    where: { slug: 'leilao-extrajudicial-veiculos-001' },
    update: {},
    create: {
      publicId: 'LEILAO-EXT-001',
      slug: 'leilao-extrajudicial-veiculos-001',
      title: 'Leilão Extrajudicial de Veículos',
      description: 'Leilão de veículos de frota renovada.',
      status: 'ABERTO_PARA_LANCES',
      auctionDate: new Date('2025-11-10T14:00:00Z'),
      endDate: new Date('2025-11-14T14:00:00Z'),
      auctionType: 'EXTRAJUDICIAL',
      auctionMethod: 'STANDARD',
      tenantId: lordlandTenant.id,
      auctioneerId: mainAuctioneer.id,
      sellerId: extrajudicialSeller.id,
      cityId: citySP.id,
      stateId: stateSP.id,
      stages: {
        create: [
          {
            name: 'Lance Inicial',
            startDate: new Date('2025-11-10T14:00:00Z'),
            endDate: new Date('2025-11-12T14:00:00Z'),
            initialPrice: 20000.00,
          },
          {
            name: 'Repescagem',
            startDate: new Date('2025-11-12T14:01:00Z'),
            endDate: new Date('2025-11-14T14:00:00Z'),
            initialPrice: 15000.00,
          },
        ],
      },
    },
  });
  console.log(`Created/Updated Extrajudicial Auction: ${extrajudicialAuction.title}`);

  // 9. Criação de Lotes, associando-os aos leilões e vinculando os ativos.
  const judicialLot = await prisma.lot.upsert({
    where: { publicId: 'LOTE-JUD-001' },
    update: {},
    create: {
      publicId: 'LOTE-JUD-001',
      auctionId: judicialAuction.id,
      number: '001',
      title: 'Apartamento em Pinheiros',
      description: 'Apartamento de 100m² com 3 quartos e 2 banheiros.',
      price: 500000.00,
      initialPrice: 500000.00,
      bidIncrementStep: 1000.00,
      status: 'EM_BREVE',
      tenantId: lordlandTenant.id,
      categoryId: categoryImoveis.id,
      subcategoryId: subcategoryApartamentos.id,
      sellerId: judicialSeller.id,
      auctioneerId: mainAuctioneer.id,
      cityId: citySP.id,
      stateId: stateSP.id,
      assets: {
        create: { assetId: assetImovel.id, assignedBy: 'seed' },
      },
    },
  });
  console.log(`Created/Updated Judicial Lot: ${judicialLot.title}`);

  const extrajudicialLot = await prisma.lot.upsert({
    where: { publicId: 'LOTE-EXT-001' },
    update: {},
    create: {
      publicId: 'LOTE-EXT-001',
      auctionId: extrajudicialAuction.id,
      number: '002',
      title: 'Carro Fiat Palio 2015',
      description: 'Fiat Palio Fire, ano 2015, em bom estado de conservação.',
      price: 30000.00,
      initialPrice: 30000.00,
      bidIncrementStep: 500.00,
      status: 'ABERTO_PARA_LANCES',
      tenantId: lordlandTenant.id,
      categoryId: categoryVeiculos.id,
      subcategoryId: subcategoryCarros.id,
      sellerId: extrajudicialSeller.id,
      auctioneerId: mainAuctioneer.id,
      cityId: citySP.id,
      stateId: stateSP.id,
      assets: {
        create: { assetId: assetVeiculo.id, assignedBy: 'seed' },
      },
    },
  });
  console.log(`Created/Updated Extrajudicial Lot: ${extrajudicialLot.title}`);

  // 10. Simulação de Habilitação de usuários e Lances (normais e máximos).
  const bidderUser = await prisma.user.findUnique({ where: { email: 'bidder@lordland.com' } });
  const judicialAuction = await prisma.auction.findUnique({ where: { slug: 'leilao-judicial-sp-001' } });
  const extrajudicialAuction = await prisma.auction.findUnique({ where: { slug: 'leilao-extrajudicial-veiculos-001' } });
  const judicialLot = await prisma.lot.findUnique({ where: { publicId: 'LOTE-JUD-001' } });
  const extrajudicialLot = await prisma.lot.findUnique({ where: { publicId: 'LOTE-EXT-001' } });

  if (bidderUser && judicialAuction && extrajudicialAuction && judicialLot && extrajudicialLot) {
    // Habilitação para o leilão judicial
    await prisma.auctionHabilitation.upsert({
      where: { userId_auctionId: { userId: bidderUser.id, auctionId: judicialAuction.id } },
      update: {},
      create: {
        userId: bidderUser.id,
        auctionId: judicialAuction.id,
      },
    });
    console.log(`User ${bidderUser.email} habilitated for auction ${judicialAuction.title}`);

    // Lance normal no lote judicial
    await prisma.bid.create({
      data: {
        lotId: judicialLot.id,
        auctionId: judicialAuction.id,
        bidderId: bidderUser.id,
        amount: 260000.00,
        tenantId: lordlandTenant.id,
      },
    });
    console.log(`Bid placed on judicial lot by ${bidderUser.email}`);

    // Lance máximo no lote extrajudicial
    await prisma.userLotMaxBid.upsert({
      where: { userId_lotId: { userId: bidderUser.id, lotId: extrajudicialLot.id } },
      update: { maxAmount: 28000.00 },
      create: {
        userId: bidderUser.id,
        lotId: extrajudicialLot.id,
        maxAmount: 28000.00,
      },
    });
    console.log(`Max bid placed on extrajudicial lot by ${bidderUser.email}`);
  }

  // 11. Simulação de Arremates e geração de Pagamentos Parcelados.
  if (bidderUser && extrajudicialLot) {
    const userWin = await prisma.userWin.upsert({
      where: { lotId: extrajudicialLot.id },
      update: {},
      create: {
        lotId: extrajudicialLot.id,
        userId: bidderUser.id,
        winningBidAmount: 28000.00,
        paymentStatus: 'PENDENTE',
      },
    });
    console.log(`User ${bidderUser.email} won lot ${extrajudicialLot.title}`);

    // Geração de pagamentos parcelados
    const totalInstallments = 3;
    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      await prisma.installmentPayment.upsert({
        where: { userWinId_installmentNumber: { userWinId: userWin.id, installmentNumber: i } },
        update: {},
        create: {
          userWinId: userWin.id,
          installmentNumber: i,
          totalInstallments: totalInstallments,
          amount: userWin.winningBidAmount / totalInstallments,
          dueDate: dueDate,
          status: 'PENDENTE',
        },
      });
    }
    console.log(`Generated ${totalInstallments} installment payments for user win ${userWin.id}`);
  }

  // 12. Criação de dados adicionais como Perguntas, Avaliações e Notificações.
  if (bidderUser && judicialLot && judicialAuction) {
    await prisma.lotQuestion.upsert({
      where: { id: 1 }, // Assuming ID 1 for simplicity or use a unique composite key
      update: {},
      create: {
        lotId: judicialLot.id,
        auctionId: judicialAuction.id,
        userId: bidderUser.id,
        userDisplayName: bidderUser.fullName || 'Bidder User',
        questionText: 'Qual o estado de conservação atual do imóvel?',
        isPublic: true,
      },
    });
    console.log(`Created Lot Question for lot ${judicialLot.title}`);

    await prisma.review.upsert({
      where: { id: 1 }, // Assuming ID 1 for simplicity or use a unique composite key
      update: {},
      create: {
        lotId: judicialLot.id,
        auctionId: judicialAuction.id,
        userId: bidderUser.id,
        rating: 5,
        comment: 'Excelente lote e ótimo leilão!',
      },
    });
    console.log(`Created Review for lot ${judicialLot.title}`);

    await prisma.notification.create({
      data: {
        userId: bidderUser.id,
        message: 'Seu lance máximo foi superado no Lote Judicial.',
        link: '/dashboard/bids',
        tenantId: lordlandTenant.id,
      },
    });
    console.log(`Created Notification for ${bidderUser.email}`);
  }

  // Criação de Configurações da Plataforma com Máscaras Padrão
  console.log('Creating Platform Settings with default ID masks...');
  
  const platformSettings = await prisma.platformSettings.upsert({
    where: { tenantId: lordlandTenant.id },
    update: {},
    create: {
      tenantId: lordlandTenant.id,
      siteTitle: 'BidExpert - Plataforma de Leilões',
      siteTagline: 'A melhor plataforma para leilões judiciais e extrajudiciais',
      isSetupComplete: true,
      crudFormMode: 'modal',
      searchItemsPerPage: 12,
      searchLoadMoreCount: 12,
      showCountdownOnLotDetail: true,
      showCountdownOnCards: true,
      showRelatedLotsOnLotDetail: true,
      relatedLotsCount: 5,
      defaultListItemsPerPage: 10,
    },
  });
  console.log(`Created/Updated Platform Settings for ${lordlandTenant.name}`);

  // Criação de Máscaras de PublicId Padrão
  await prisma.idMasks.upsert({
    where: { platformSettingsId: platformSettings.id },
    update: {},
    create: {
      platformSettingsId: platformSettings.id,
      auctionCodeMask: 'AUC-{YYYY}-{####}',
      lotCodeMask: 'LOTE-{YY}{MM}-{#####}',
      sellerCodeMask: 'COM-{YYYY}-{###}',
      auctioneerCodeMask: 'LEILOE-{YYYY}-{###}',
      userCodeMask: 'USER-{######}',
      assetCodeMask: 'ASSET-{YYYY}-{#####}',
      categoryCodeMask: 'CAT-{###}',
      subcategoryCodeMask: 'SUBCAT-{####}',
    },
  });
  console.log('Created default ID masks');

  // Inicialização dos Contadores
  console.log('Initializing counters...');
  const entityTypes = ['auction', 'lot', 'asset', 'auctioneer', 'seller', 'user', 'category', 'subcategory'];
  
  for (const entityType of entityTypes) {
    await prisma.counterState.upsert({
      where: {
        tenantId_entityType: {
          tenantId: lordlandTenant.id,
          entityType,
        },
      },
      update: {},
      create: {
        tenantId: lordlandTenant.id,
        entityType,
        currentValue: 0,
      },
    });
  }
  console.log('Counters initialized');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
