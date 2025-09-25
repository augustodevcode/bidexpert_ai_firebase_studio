// scripts/seed-data-extended-gemini.ts
/**
 * @fileoverview This script extends the existing seed data to cover additional tables
 * and ensure comprehensive test cases for all ENUM values and relationships.
 * It is designed to be run after the main seed-data-extended.ts script.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import {
  AuctionMethod,
  AuctionStatus,
  AuctionType,
  HabilitationStatus,
  LotStatus,
  UserHabilitationStatus,
  PaymentStatus,
  DirectSaleOfferStatus,
  DirectSaleOfferType,
  DocumentTemplateType,
  UserDocumentStatus,
  JudicialPartyType,
  AssetStatus,
  AssetType,
} from '@prisma/client';

const prisma = new PrismaClient();

export async function seedGeminiExtended() {
  console.log('Starting Gemini extended seeding...');

  // Fetch existing data to link new data
  const tenants = await prisma.tenant.findMany();
  const users = await prisma.user.findMany();
  const auctions = await prisma.auction.findMany();
  const lots = await prisma.lot.findMany();
  const categories = await prisma.lotCategory.findMany();
  const judicialProcesses = await prisma.judicialProcess.findMany();

  if (tenants.length === 0 || users.length === 0 || auctions.length === 0 || lots.length === 0 || categories.length === 0) {
    console.warn('Not enough base data to perform extended seeding. Please run the main seed script first.');
    return;
  }

  const tenant1 = tenants[0];
  const user1 = users[0];
  const user2 = users[1] || users[0]; // Ensure at least two users for interactions
  const auction1 = auctions[0];
  const lot1 = lots[0];
  const category1 = categories[0];
  const judicialProcess1 = judicialProcesses[0];

  // 1. Seed AuctionHabilitation
  console.log('Seeding AuctionHabilitation...');
  if(user1 && auction1) {
    await prisma.auctionHabilitation.createMany({
        data: [
        { userId: user1.id, auctionId: auction1.id },
        { userId: user2.id, auctionId: auction1.id },
        ],
        skipDuplicates: true,
    });
  }
  console.log('AuctionHabilitation seeded.');

  // 2. Seed AuctionStage
  console.log('Seeding AuctionStage...');
  if(auction1) {
    await prisma.auctionStage.createMany({
        data: [
        {
            name: 'Primeiro Leilão',
            startDate: faker.date.past(),
            endDate: faker.date.future(),
            auctionId: auction1.id,
            initialPrice: faker.number.float({ min: 1000, max: 5000, multipleOf: 0.01 }),
        },
        {
            name: 'Segundo Leilão',
            startDate: faker.date.future(),
            endDate: faker.date.future(),
            auctionId: auction1.id,
            initialPrice: faker.number.float({ min: 500, max: 2500, multipleOf: 0.01 }),
        },
        ],
        skipDuplicates: true,
    });
  }
  console.log('AuctionStage seeded.');

  // 3. Seed ContactMessage
  console.log('Seeding ContactMessage...');
  await prisma.contactMessage.createMany({
    data: [
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: 'Dúvida sobre Leilão',
        message: faker.lorem.paragraph(),
        isRead: false,
        tenantId: tenant1.id,
      },
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: 'Feedback da Plataforma',
        message: faker.lorem.paragraph(),
        isRead: true,
        tenantId: tenant1.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log('ContactMessage seeded.');

  // 4. Seed dataSource
  console.log('Seeding dataSource...');
  await prisma.dataSource.createMany({
    data: [
      {
        name: 'Leilões Ativos',
        description: 'Fonte de dados para leilões abertos para lances',
      },
      {
        name: 'Usuários Habilitados',
        description: 'Fonte de dados para usuários com habilitação aprovada',
      },
    ],
    skipDuplicates: true,
  });
  console.log('dataSource seeded.');

  // 5. Seed DocumentTemplate
  console.log('Seeding DocumentTemplate...');
  await prisma.documentTemplate.createMany({
    data: [
      {
        name: 'Termo de Arrematação Padrão',
        type: DocumentTemplateType.WINNING_BID_TERM,
        content: '<h1>Termo de Arrematação</h1><p>Este documento certifica a arrematação do lote {{lot.title}} por {{user.fullName}}.</p>',
        tenantId: tenant1.id,
      },
      {
        name: 'Relatório de Avaliação de Ativo',
        type: DocumentTemplateType.EVALUATION_REPORT,
        content: '<h1>Relatório de Avaliação</h1><p>Avaliação do ativo {{asset.title}}.</p>',
        tenantId: tenant1.id,
      },
      {
        name: 'Certificado de Leilão',
        type: DocumentTemplateType.AUCTION_CERTIFICATE,
        content: '<h1>Certificado de Leilão</h1><p>Certificamos a realização do leilão {{auction.title}}.</p>',
        tenantId: tenant1.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log('DocumentTemplate seeded.');

  // 6. Seed MediaItem (standalone examples)
  console.log('Seeding MediaItem...');
  if(user1 && user2) {
    await prisma.mediaItem.createMany({
        data: [
        {
            fileName: 'image1.jpg',
            fileType: 'image/jpeg',
            size: 12345,
            url: 'uploads/image1.jpg',
            tenantId: tenant1.id,
        },
        {
            fileName: 'document1.pdf',
            fileType: 'application/pdf',
            size: 54321,
            url: 'uploads/document1.pdf',
            tenantId: tenant1.id,
        },
        ],
        skipDuplicates: true,
    });
  }
  console.log('MediaItem seeded.');

  // 7. Seed Notification
  console.log('Seeding Notification...');
  if(user1 && user2 && lot1) {
    await prisma.notification.createMany({
        data: [
        {
            userId: user1.id,
            tenantId: tenant1.id,
            message: 'Seu lance no lote X foi superado.',
            link: `/dashboard/bids/${lot1.id}`,
            isRead: false,
        },
        {
            userId: user2.id,
            tenantId: tenant1.id,
            message: 'Você arrematou o lote Y!',
            link: `/checkout/${lot1.id}`,
            isRead: true,
        },
        ],
        skipDuplicates: true,
    });
  }
  console.log('Notification seeded.');

  // 8. Ensure ENUM coverage for existing tables
  const auctioneer = await prisma.auctioneer.findFirst();
  const seller = await prisma.seller.findFirst();

  if(auctioneer && seller) {
    await prisma.auction.create({
        data: {
        tenantId: tenant1.id,
        title: 'Leilão de Rascunho',
        description: 'Este leilão está em rascunho.',
        status: AuctionStatus.RASCUNHO,
        auctionDate: faker.date.future(),
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        },
    });

    await prisma.auction.create({
        data: {
        tenantId: tenant1.id,
        title: 'Leilão Cancelado',
        description: 'Este leilão foi cancelado.',
        status: AuctionStatus.CANCELADO,
        auctionDate: faker.date.past(),
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        },
    });
  }

  if(auction1) {
    await prisma.lot.create({
        data: {
        auctionId: auction1.id,
        tenantId: tenant1.id,
        title: 'Lote Não Vendido',
        description: 'Este lote não foi vendido.',
        initialPrice: faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 }),
        status: LotStatus.NAO_VENDIDO,
        categoryId: category1.id,
        },
    });

    await prisma.lot.create({
        data: {
        auctionId: auction1.id,
        tenantId: tenant1.id,
        title: 'Lote Retirado',
        description: 'Este lote foi retirado do leilão.',
        initialPrice: faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 }),
        status: LotStatus.RETIRADO,
        categoryId: category1.id,
        },
    });
  }

  if(user1 && user2) {
    await prisma.user.update({
        where: { id: user1.id },
        data: { habilitationStatus: UserHabilitationStatus.HABILITADO },
    });
    await prisma.user.update({
        where: { id: user2.id },
        data: { habilitationStatus: UserHabilitationStatus.REJECTED_DOCUMENTS },
    });
  }

  if(seller && category1) {
    await prisma.directSaleOffer.create({
        data: {
        tenantId: tenant1.id,
        sellerId: seller.id,
        categoryId: category1.id,
        publicId: faker.string.uuid(),
        title: 'Oferta de Venda Direta Expirada',
        description: 'Esta oferta expirou.',
        offerType: DirectSaleOfferType.BUY_NOW,
        price: faker.number.float({ min: 1000, max: 5000, multipleOf: 0.01 }),
        status: DirectSaleOfferStatus.EXPIRED,
        expiresAt: faker.date.past(),
        },
    });

    await prisma.directSaleOffer.create({
        data: {
        tenantId: tenant1.id,
        sellerId: seller.id,
        categoryId: category1.id,
        publicId: faker.string.uuid(),
        title: 'Oferta de Venda Direta em Rascunho',
        description: 'Esta oferta está em rascunho.',
        offerType: DirectSaleOfferType.ACCEPTS_PROPOSALS,
        minimumOfferPrice: faker.number.float({ min: 500, max: 2000, multipleOf: 0.01 }),
        status: DirectSaleOfferStatus.RASCUNHO,
        },
    });
  }

  const documentType1 = await prisma.documentType.findFirst();
  if (documentType1 && user1 && user2) {
    await prisma.userDocument.create({
      data: {
        userId: user1.id,
        documentTypeId: documentType1.id,
        fileUrl: faker.internet.url(),
        status: UserDocumentStatus.APPROVED,
        tenantId: tenant1.id,
      },
    });
    await prisma.userDocument.create({
      data: {
        userId: user2.id,
        documentTypeId: documentType1.id,
        fileUrl: faker.internet.url(),
        status: UserDocumentStatus.REJECTED,
        rejectionReason: 'Documento ilegível.',
        tenantId: tenant1.id,
      },
    });
  }

  if (judicialProcess1) {
    await prisma.judicialParty.createMany({
      data: [
        {
          name: faker.person.fullName(),
          documentNumber: faker.string.numeric(11),
          partyType: JudicialPartyType.AUTOR,
          processId: judicialProcess1.id,
        },
        {
          name: faker.person.fullName(),
          documentNumber: faker.string.numeric(11),
          partyType: JudicialPartyType.REU,
          processId: judicialProcess1.id,
        },
        {
          name: faker.person.fullName(),
          documentNumber: faker.string.numeric(11),
          partyType: JudicialPartyType.ADVOGADO_AUTOR,
          processId: judicialProcess1.id,
        },
      ],
      skipDuplicates: true,
    });
  }

  if(seller && category1) {
    await prisma.asset.create({
        data: {
        tenantId: tenant1.id,
        publicId: faker.string.uuid(),
        title: 'Ativo Loteado',
        status: AssetStatus.LOTEADO,
        categoryId: category1.id,
        sellerId: seller.id,
        evaluationValue: 1000,
        }, 
    });

    await prisma.asset.create({
        data: {
        tenantId: tenant1.id,
        publicId: faker.string.uuid(),
        title: 'Ativo Removido',
        status: AssetStatus.REMOVIDO,
        categoryId: category1.id,
        sellerId: seller.id,
        evaluationValue: 2000,
        },
    });
  }


  console.log('Gemini extended seeding finished.');
}