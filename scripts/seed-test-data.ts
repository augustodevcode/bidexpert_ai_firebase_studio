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
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await prisma.bid.deleteMany({});
    await prisma.lot.deleteMany({});
    await prisma.auction.deleteMany({});
    await prisma.auctionHabilitation.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.lotCategory.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create tenant
    console.log('📍 Creating tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        id: BigInt(1),
        name: 'Test Tenant',
        subdomain: 'test',
        status: 'ACTIVE',
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
        habilitationStatus: 'APPROVED',
        accountType: 'PHYSICAL',
      },
    });

    const bidder1 = await prisma.user.create({
      data: {
        email: 'test-bidder@bidexpert.com',
        password: hashedPasswordBidder,
        fullName: 'Test Bidder',
        cpf: '00000000002',
        habilitationStatus: 'APPROVED',
        accountType: 'PHYSICAL',
      },
    });

    const bidder2 = await prisma.user.create({
      data: {
        email: 'bidder2@test.com',
        password: hashedPasswordBidder,
        fullName: 'Test Bidder 2',
        cpf: '00000000003',
        habilitationStatus: 'APPROVED',
        accountType: 'PHYSICAL',
      },
    });

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
      prisma.lotCategory.create({
        data: {
          tenantId: BigInt(1),
          name: 'Imóveis',
          slug: 'imoveis',
        },
      }),
      prisma.lotCategory.create({
        data: {
          tenantId: BigInt(1),
          name: 'Veículos',
          slug: 'veiculos',
        },
      }),
      prisma.lotCategory.create({
        data: {
          tenantId: BigInt(1),
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
        tenantId: BigInt(1),
        id: BigInt(1),
        name: 'Test Auction 1',
        description: 'Test auction for e2e testing',
        status: 'ACTIVE',
        startDate: now,
        endDate: auctionEndTime,
        startingBid: 5000,
        minimumIncrement: 100,
        websocketEnabled: true,
        softCloseEnabled: true,
        softCloseMinutes: 5,
        blockchainEnabled: false,
      },
    });

    // Create lots
    console.log('🎯 Creating lots...');
    const lot1 = await prisma.lot.create({
      data: {
        tenantId: BigInt(1),
        id: BigInt(1),
        auctionId: auction1.id,
        categoryId: categories[0].id,
        title: 'Apartamento com 3 quartos - São Paulo',
        description:
          'Apartamento bem localizado, prédio novo com todas as comodidades.',
        startingBid: 250000,
        currentBid: 250000,
        status: 'ACTIVE',
        order: 1,
        minimumIncrement: 5000,
        webSocketEnabled: true,
      },
    });

    const lot2 = await prisma.lot.create({
      data: {
        tenantId: BigInt(1),
        id: BigInt(2),
        auctionId: auction1.id,
        categoryId: categories[1].id,
        title: 'Carro 2020 - Corolla',
        description: 'Carro em excelente estado, baixa quilometragem.',
        startingBid: 50000,
        currentBid: 50000,
        status: 'ACTIVE',
        order: 2,
        minimumIncrement: 1000,
        webSocketEnabled: true,
      },
    });

    // Habilitate users for auction
    console.log('✅ Habilitating users...');
    await prisma.auctionHabilitation.create({
      data: {
        tenantId: BigInt(1),
        auctionId: auction1.id,
        userId: bidder1.id,
        status: 'APPROVED',
        approvedAt: now,
      },
    });

    await prisma.auctionHabilitation.create({
      data: {
        tenantId: BigInt(1),
        auctionId: auction1.id,
        userId: bidder2.id,
        status: 'APPROVED',
        approvedAt: now,
      },
    });

    // Create bids
    console.log('💰 Creating bids...');
    const bid1 = await prisma.bid.create({
      data: {
        tenantId: BigInt(1),
        id: BigInt(1),
        auctionId: auction1.id,
        lotId: lot1.id,
        userId: bidder1.id,
        amount: 250000,
        status: 'ACCEPTED',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
        isAutoBid: false,
        webSocketSent: true,
        blockchainRecorded: false,
      },
    });

    const bid2 = await prisma.bid.create({
      data: {
        tenantId: BigInt(1),
        id: BigInt(2),
        auctionId: auction1.id,
        lotId: lot1.id,
        userId: bidder2.id,
        amount: 260000,
        status: 'ACCEPTED',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
        isAutoBid: false,
        webSocketSent: true,
        blockchainRecorded: false,
      },
    });

    // Update lot current bid
    await prisma.lot.update({
      where: { id: lot1.id },
      data: { currentBid: 260000 },
    });

    // Create bids for lot 2
    const bid3 = await prisma.bid.create({
      data: {
        tenantId: BigInt(1),
        id: BigInt(3),
        auctionId: auction1.id,
        lotId: lot2.id,
        userId: bidder1.id,
        amount: 50000,
        status: 'ACCEPTED',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000),
        isAutoBid: false,
        webSocketSent: true,
        blockchainRecorded: false,
      },
    });

    const bid4 = await prisma.bid.create({
      data: {
        tenantId: BigInt(1),
        id: BigInt(4),
        auctionId: auction1.id,
        lotId: lot2.id,
        userId: bidder2.id,
        amount: 55000,
        status: 'ACCEPTED',
        timestamp: new Date(now.getTime() - 20 * 60 * 1000),
        isAutoBid: false,
        webSocketSent: true,
        blockchainRecorded: false,
      },
    });

    await prisma.lot.update({
      where: { id: lot2.id },
      data: { currentBid: 55000 },
    });

    console.log('✨ Test data seeded successfully!');
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
