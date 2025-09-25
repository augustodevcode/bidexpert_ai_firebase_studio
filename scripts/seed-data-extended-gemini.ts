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
  LotStatus,
  UserHabilitationStatus,
  PaymentStatus,
  DirectSaleOfferStatus,
  DirectSaleOfferType,
  DocumentTemplateType,
  UserDocumentStatus,
  JudicialPartyType,
  AssetStatus,
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
  const judicialProcess1 = judicialProcesses.length > 0 ? judicialProcesses[0] : null;

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
            name: 'Primeiro Leilão (Estendido)',
            startDate: faker.date.past(),
            endDate: faker.date.future(),
            auctionId: auction1.id,
            initialPrice: faker.number.float({ min: 1000, max: 5000, multipleOf: 0.01 }),
        },
        {
            name: 'Segundo Leilão (Estendido)',
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
        subject: 'Dúvida sobre Leilão (Estendido)',
        message: faker.lorem.paragraph(),
        isRead: false,
      },
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: 'Feedback da Plataforma (Estendido)',
        message: faker.lorem.paragraph(),
        isRead: true,
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
        name: 'Leilões Ativos (Estendido)',
        modelName: 'Auction',
        description: 'Leilões com status ABERTO_PARA_LANCES.',
        fields: {
          select: { id: true, title: true, status: true }
        },
      },
      {
        name: 'Usuários Habilitados (Estendido)',
        modelName: 'User',
        description: 'Usuários com habilitação aprovada.',
        fields: {
          select: { id: true, email: true, fullName: true, habilitationStatus: true }
        },
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
        name: 'Termo de Arrematação Padrão (Estendido)',
        type: DocumentTemplateType.WINNING_BID_TERM,
        content: '<h1>Termo Estendido</h1><p>Lote: {{lot.title}}</p>',
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
            fileName: 'image1_extended.jpg',
            mimeType: 'image/jpeg',
            storagePath: 'uploads/image1_extended.jpg',
            urlOriginal: 'https://example.com/uploads/image1_extended.jpg',
            title: 'Imagem Estendida 1',
            uploadedByUserId: user1.id,
            tenantId: tenant1.id
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
            message: 'Seu lance foi superado (Estendido).',
            link: `/dashboard/bids/${lot1.id}`,
            isRead: false,
        },
        ],
        skipDuplicates: true,
    });
  }
  console.log('Notification seeded.');

  // 8. Ensure ENUM coverage
  const auctioneer = await prisma.auctioneer.findFirst({ where: { tenantId: tenant1.id } });
  const seller = await prisma.seller.findFirst({ where: { tenantId: tenant1.id } });

  if(auctioneer && seller) {
    const existingDraft = await prisma.auction.findFirst({ where: { status: AuctionStatus.RASCUNHO, tenantId: tenant1.id } });
    if (!existingDraft) {
      await prisma.auction.create({
          data: {
          tenantId: tenant1.id,
          title: 'Leilão de Rascunho (Estendido)',
          description: 'Este leilão está em rascunho.',
          status: AuctionStatus.RASCUNHO,
          auctioneerId: auctioneer.id,
          sellerId: seller.id,
          },
      });
    }

     const existingCancelled = await prisma.auction.findFirst({ where: { status: AuctionStatus.CANCELADO, tenantId: tenant1.id } });
    if (!existingCancelled) {
      await prisma.auction.create({
          data: {
          tenantId: tenant1.id,
          title: 'Leilão Cancelado (Estendido)',
          description: 'Este leilão foi cancelado.',
          status: AuctionStatus.CANCELADO,
          auctioneerId: auctioneer.id,
          sellerId: seller.id,
          },
      });
    }
  }

  if(auction1) {
    const existingUnsold = await prisma.lot.findFirst({ where: { status: LotStatus.NAO_VENDIDO, tenantId: tenant1.id } });
    if (!existingUnsold) {
      await prisma.lot.create({
          data: {
          auctionId: auction1.id,
          tenantId: tenant1.id,
          title: 'Lote Não Vendido (Estendido)',
          description: 'Este lote não foi vendido.',
          price: faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 }),
          status: LotStatus.NAO_VENDIDO,
          type: 'GERAL',
          categoryId: category1.id,
          },
      });
    }
  }

  // User Habilitation Statuses
  await prisma.user.update({ where: { id: user1.id }, data: { habilitationStatus: UserHabilitationStatus.HABILITADO } });
  await prisma.user.update({ where: { id: user2.id }, data: { habilitationStatus: UserHabilitationStatus.REJECTED_DOCUMENTS } });
  
  // DirectSaleOffer Statuses
  if (seller) {
    const existingExpired = await prisma.directSaleOffer.findFirst({ where: { status: DirectSaleOfferStatus.EXPIRED, tenantId: tenant1.id } });
    if (!existingExpired) {
        await prisma.directSaleOffer.create({
            data: {
                tenantId: tenant1.id,
                sellerId: seller.id,
                categoryId: category1.id,
                publicId: faker.string.uuid(),
                title: 'Oferta Expirada (Estendida)',
                offerType: DirectSaleOfferType.BUY_NOW,
                price: 100,
                status: DirectSaleOfferStatus.EXPIRED,
                expiresAt: faker.date.past(),
            }
        });
    }
  }
  
  // UserDocument Statuses
  const documentType1 = await prisma.documentType.findFirst();
  if (documentType1 && user1) {
      await prisma.userDocument.upsert({
          where: { userId_documentTypeId: { userId: user1.id, documentTypeId: documentType1.id } },
          update: { status: UserDocumentStatus.APPROVED },
          create: {
            userId: user1.id,
            documentTypeId: documentType1.id,
            fileUrl: faker.internet.url(),
            status: UserDocumentStatus.APPROVED,
          },
      });
  }

  // JudicialParty Types
  if (judicialProcess1) {
    await prisma.judicialParty.createMany({
      data: [
        { name: faker.person.fullName(), partyType: JudicialPartyType.ADVOGADO_AUTOR, processId: judicialProcess1.id, },
        { name: faker.person.fullName(), partyType: JudicialPartyType.ADVOGADO_REU, processId: judicialProcess1.id, },
      ],
      skipDuplicates: true,
    });
  }
  
  // Asset Statuses
  if(seller) {
    await prisma.asset.create({
        data: {
            tenantId: tenantId,
            publicId: faker.string.uuid(),
            title: 'Ativo Loteado (Estendido)',
            status: AssetStatus.LOTEADO,
            categoryId: category1.id,
            sellerId: seller.id,
        },
    });
  }


  console.log('Gemini extended seeding finished.');
}
