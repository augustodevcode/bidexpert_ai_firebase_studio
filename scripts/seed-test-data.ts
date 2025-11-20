/**
 * Seed script for e2e test data
 * Generates realistic test data for auction platform testing
 * Run with: npm run db:seed:test
 */

import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import bcryptjs from 'bcryptjs';

async function seedTestData() {
  console.log('🌱 Starting test data seed...');

  try {
    // Clear existing test data in the correct order
    console.log('🧹 Clearing existing test data...');
    await prisma.installmentPayment.deleteMany({});
    await prisma.userWin.deleteMany({});
    await prisma.userLotMaxBid.deleteMany({});
    await prisma.bid.deleteMany({});
    await prisma.assetsOnLots.deleteMany({});
    await prisma.lotStagePrice.deleteMany({});
    await prisma.lotQuestion.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.assetMedia.deleteMany({});
    await prisma.judicialParty.deleteMany({});
    await prisma.usersOnRoles.deleteMany({});
    await prisma.usersOnTenants.deleteMany({});
    await prisma.auctionHabilitation.deleteMany({});
    await prisma.lot.deleteMany({});
    await prisma.auctionStage.deleteMany({});
    await prisma.auction.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.judicialProcess.deleteMany({});
    await prisma.seller.deleteMany({});
    await prisma.auctioneer.deleteMany({});
    await prisma.userDocument.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.subcategory.deleteMany({});
    await prisma.lotCategory.deleteMany({});
    await prisma.directSaleOffer.deleteMany({});
    await prisma.platformSettings.deleteMany({});
    await prisma.subscriber.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.judicialDistrict.deleteMany({});
    await prisma.judicialBranch.deleteMany({});
    await prisma.city.deleteMany({});
    await prisma.state.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create tenant
    console.log('📍 Creating tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        subdomain: 'test',
      },
    });

    // Create roles
    console.log('🎭 Creating roles...');
    const adminRole = await prisma.role.create({
      data: { name: 'ADMIN', nameNormalized: 'admin', description: 'Administrator' },
    });
    const bidderRole = await prisma.role.create({
      data: { name: 'BIDDER', nameNormalized: 'bidder', description: 'Bidder' },
    });
    const lawyerRole = await prisma.role.create({
      data: { 
        name: 'LAWYER', 
        nameNormalized: 'lawyer', 
        description: 'Lawyer',
        permissions: ['lawyer_dashboard:view']
      },
    });

    // Create users
    console.log('👥 Creating users...');
    const hashedPasswordAdmin = await bcryptjs.hash('Admin@12345', 10);
    const hashedPasswordBidder = await bcryptjs.hash('Test@12345', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@bidexpert.com',
        password: hashedPasswordAdmin,
        fullName: 'Admin User',
        cpf: '00000000001',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL',
      },
    });

    const bidder1 = await prisma.user.create({
      data: {
        email: 'test-bidder@bidexpert.com',
        password: hashedPasswordBidder,
        fullName: 'Test Bidder',
        cpf: '00000000002',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL',
      },
    });

    const bidder2 = await prisma.user.create({
      data: {
        email: 'bidder2@test.com',
        password: hashedPasswordBidder,
        fullName: 'Test Bidder 2',
        cpf: '00000000003',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL',
      },
    });

    const lawyer = await prisma.user.create({
      data: {
        email: 'advogado@bidexpert.com.br',
        password: hashedPasswordBidder,
        fullName: 'Advogado Teste',
        cpf: '00000000004',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL',
      },
    });

    // Assign roles
    await prisma.usersOnRoles.create({ data: { userId: admin.id, roleId: adminRole.id, assignedBy: 'system' } });
    await prisma.usersOnRoles.create({ data: { userId: bidder1.id, roleId: bidderRole.id, assignedBy: 'system' } });
    await prisma.usersOnRoles.create({ data: { userId: bidder2.id, roleId: bidderRole.id, assignedBy: 'system' } });
    await prisma.usersOnRoles.create({ data: { userId: lawyer.id, roleId: lawyerRole.id, assignedBy: 'system' } });

    // Assign users to tenant
    console.log('🔗 Assigning users to tenant...');
    await prisma.usersOnTenants.create({ data: { userId: admin.id, tenantId: tenant.id, assignedBy: 'system' } });
    await prisma.usersOnTenants.create({ data: { userId: bidder1.id, tenantId: tenant.id, assignedBy: 'system' } });
    await prisma.usersOnTenants.create({ data: { userId: bidder2.id, tenantId: tenant.id, assignedBy: 'system' } });
    await prisma.usersOnTenants.create({ data: { userId: lawyer.id, tenantId: tenant.id, assignedBy: 'system' } });

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
      prisma.lotCategory.create({
        data: {
          name: 'Imóveis',
          slug: 'imoveis',
        },
      }),
      prisma.lotCategory.create({
        data: {
          name: 'Veículos',
          slug: 'veiculos',
        },
      }),
      prisma.lotCategory.create({
        data: {
          name: 'Máquinas',
          slug: 'maquinas',
        },
      }),
    ]);

    // Create auctions
    console.log('🏛️  Creating auctions...');
    const now = new Date();
    const auctionEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    const auction1 = await prisma.auction.create({
      data: {
        tenantId: tenant.id,
        title: 'Leilão de Teste 1',
        description: 'Leilão de teste para testes e2e',
        status: 'ABERTO_PARA_LANCES',
        auctionDate: now,
        endDate: auctionEndTime,
        auctionType: 'JUDICIAL',
        auctionMethod: 'STANDARD',
        participation: 'ONLINE',
        softCloseEnabled: true,
        softCloseMinutes: 5,
      },
    });

    const auction2 = await prisma.auction.create({
      data: {
        tenantId: tenant.id,
        title: 'Leilão de Teste 2 (Em Breve)',
        description: 'Leilão futuro para testes e2e',
        status: 'EM_BREVE',
        auctionDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        auctionType: 'EXTRAJUDICIAL',
        auctionMethod: 'STANDARD',
        participation: 'ONLINE',
      },
    });

    // Create lots
    console.log('🎯 Creating lots...');
    const lot1 = await prisma.lot.create({
      data: {
        tenantId: tenant.id,
        auctionId: auction1.id,
        categoryId: categories[0].id,
        title: 'Apartamento com 3 quartos - São Paulo',
        description:
          'Apartamento bem localizado, prédio novo com todas as comodidades.',
        price: 250000,
        initialPrice: 250000,
        status: 'ABERTO_PARA_LANCES',
        type: 'IMOVEL',
      },
    });

    const lot2 = await prisma.lot.create({
      data: {
        tenantId: tenant.id,
        auctionId: auction1.id,
        categoryId: categories[1].id,
        title: 'Carro Esportivo 2023',
        description: 'Carro com baixa quilometragem, único dono.',
        price: 150000,
        initialPrice: 150000,
        status: 'ABERTO_PARA_LANCES',
        type: 'VEICULO',
      },
    });

    const lot3 = await prisma.lot.create({
      data: {
        tenantId: tenant.id,
        auctionId: auction2.id,
        categoryId: categories[2].id,
        title: 'Trator Agrícola',
        description: 'Trator em bom estado, pronto para o trabalho.',
        price: 80000,
        initialPrice: 80000,
        status: 'EM_BREVE',
        type: 'MAQUINARIO',
      },
    });

    console.log('✅ Test data seeded successfully!');
    console.log('');
    console.log('Test Users:');
    console.log(`  Admin: admin@bidexpert.com / Admin@12345`);
    console.log(`  Bidder 1: test-bidder@bidexpert.com / Test@12345`);
    console.log(`  Bidder 2: bidder2@test.com / Test@12345`);
    console.log('');
    console.log('Test Data:');
    console.log(`  Auction 1: ID ${auction1.id} (Active)`);
    console.log(`  Lot 1: ID ${lot1.id} (Apartment - Current bid: R$ 260.000)`);
    console.log(`  Lot 2: ID ${lot2.id} (Car - Current bid: R$ 55.000)`);
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
