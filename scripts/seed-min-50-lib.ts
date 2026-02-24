/**
 * @fileoverview Seed mínimo (50 registros) para tabelas zeradas não-config.
 * Usa services quando disponíveis e garante pais necessários.
 *
 * BDD: Garantir que tabelas zeradas tenham volume mínimo operacional.
 * TDD: Cobrir a geração com testes unitários e visuais básicos.
 */
import { faker } from '@faker-js/faker/locale/pt_BR';
import { prisma } from '../src/lib/prisma';
import { Prisma } from '@prisma/client';
import { ReportService } from '../src/services/report.service';
import { SubscriberService } from '../src/services/subscriber.service';
import { ContactMessageService } from '../src/services/contact-message.service';
import { PaymentMethodService } from '../src/services/payment-method.service';
import { BidderService } from '../src/services/bidder.service';
import { UserService } from '../src/services/user.service';

interface SeedMin50Options {
  targetCount: number;
}

interface SeedMin50Deps {
  reportService: ReportService;
  subscriberService: SubscriberService;
  contactMessageService: ContactMessageService;
  paymentMethodService: PaymentMethodService;
  bidderService: BidderService;
  userService: UserService;
}

const DEFAULT_OPTIONS: SeedMin50Options = {
  targetCount: 50,
};

function buildDeps(): SeedMin50Deps {
  return {
    reportService: new ReportService(),
    subscriberService: new SubscriberService(),
    contactMessageService: new ContactMessageService(),
    paymentMethodService: new PaymentMethodService(),
    bidderService: new BidderService(),
    userService: new UserService(),
  };
}

async function ensureAdminUser(tenantId: bigint) {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@bidexpert.com', UsersOnTenants: { some: { tenantId } } }
  });
  if (admin) return admin;
  const fallback = await prisma.user.findFirst({ where: { UsersOnTenants: { some: { tenantId } } } });
  if (!fallback) throw new Error('Nenhum usuário encontrado para criar relatórios.');
  return fallback;
}

async function ensureTickets(tenantId: bigint, target: number) {
  const existing = await prisma.iTSM_Ticket.count({ where: { tenantId } });
  if (existing >= target) return;

  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  if (users.length === 0) throw new Error('Sem usuários para criar tickets ITSM.');

  for (let i = existing; i < target; i++) {
    const user = users[i % users.length];
    await prisma.iTSM_Ticket.create({
      data: {
        tenantId,
        publicId: `TKT-MIN50-${Date.now()}-${i}`,
        userId: user.id,
        title: `Chamado seed ${i + 1}`,
        description: 'Seed automático para preencher tickets.',
        status: 'ABERTO' as any,
        priority: 'MEDIA' as any,
        category: 'OUTRO' as any,
        updatedAt: new Date(),
      }
    });
  }
}

async function ensureBidderProfiles(tenantId: bigint, deps: SeedMin50Deps, target: number) {
  const count = await prisma.bidderProfile.count({ where: { tenantId } });
  if (count >= target) return;

  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: target });
  for (const user of users) {
    await deps.bidderService.getOrCreateBidderProfile(user.id);
    await deps.bidderService.updateBidderProfile(user.id, {
      documentStatus: 'APPROVED' as any,
      city: 'São Paulo',
      state: 'SP',
      phone: faker.phone.number(),
    });
  }
}

export async function seedMin50ZeroTables(
  tenantId: bigint,
  options: Partial<SeedMin50Options> = {},
  deps: SeedMin50Deps = buildDeps()
) {
  const { targetCount } = { ...DEFAULT_OPTIONS, ...options };

  const adminUser = await ensureAdminUser(tenantId);

  // DataSource (sem tenant) - tabela zerada
  if ((await prisma.dataSource.count()) === 0) {
    const payload = Array.from({ length: targetCount }).map((_, i) => ({
      name: `DataSource Seed ${i + 1}`,
      modelName: `SeedModel${i + 1}`,
      fields: { key: 'value', index: i + 1 },
    }));
    await prisma.dataSource.createMany({ data: payload });
  }

  // Report (por tenant)
  if ((await prisma.report.count({ where: { tenantId } })) === 0) {
    for (let i = 0; i < targetCount; i++) {
      await deps.reportService.createReport({
        name: `Relatório Seed ${i + 1}`,
        description: 'Seed automático de relatórios.',
        definition: { filters: [], columns: ['id', 'title'] },
        createdById: adminUser.id.toString(),
      }, tenantId.toString());
    }
  }

  // Subscriber (newsletter)
  if ((await prisma.subscriber.count({ where: { tenantId } })) === 0) {
    for (let i = 0; i < targetCount; i++) {
      await deps.subscriberService.createSubscriber({
        email: `subscriber${i + 1}@seed.com`,
        name: faker.person.fullName(),
      }, tenantId.toString());
    }
  }

  // ContactMessage (se zerada)
  if ((await prisma.contactMessage.count()) === 0) {
    for (let i = 0; i < targetCount; i++) {
      await deps.contactMessageService.saveMessage({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: `Contato Seed ${i + 1}`,
        message: 'Mensagem de contato seed para preencher tabela.'
      } as any);
    }
  }

  // PasswordResetToken
  if ((await prisma.passwordResetToken.count()) === 0) {
    const payload = Array.from({ length: targetCount }).map((_, i) => ({
      email: `reset${i + 1}@seed.com`,
      token: `token-${i + 1}-${Date.now()}`,
      expires: faker.date.soon({ days: 7 }),
    }));
    await prisma.passwordResetToken.createMany({ data: payload });
  }

  // TenantInvoice
  if ((await prisma.tenantInvoice.count({ where: { tenantId } })) === 0) {
    const now = new Date();
    const payload = Array.from({ length: targetCount }).map((_, i) => ({
      tenantId,
      invoiceNumber: `INV-SEED-${i + 1}`,
      amount: faker.number.int({ min: 1000, max: 50000 }),
      currency: 'BRL',
      periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth(), 1),
      issueDate: now,
      dueDate: faker.date.soon({ days: 30 }),
      status: 'PENDING' as any,
      description: 'Seed automático de faturas.',
      updatedAt: new Date(),
    }));
    await prisma.tenantInvoice.createMany({ data: payload });
  }

  // form_submissions
  if ((await prisma.formSubmission.count({ where: { tenantId } })) === 0) {
    const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 10 });
    if (users.length > 0) {
      const payload = Array.from({ length: targetCount }).map((_, i) => ({
        tenantId,
        userId: users[i % users.length].id,
        formType: `FORM_SEED_${i + 1}`,
        status: 'SUBMITTED' as any,
        validationScore: faker.number.int({ min: 60, max: 100 }),
        data: { index: i + 1, note: 'Seed form submission' },
        validationErrors: Prisma.JsonNull,
        completedAt: faker.date.recent({ days: 30 }),
        updatedAt: new Date(),
      }));
      await prisma.form_submissions.createMany({ data: payload });
    }
  }

  // ITSM (attachments, chat logs, query logs)
  if ((await prisma.iTSM_Ticket.count({ where: { tenantId } })) === 0) {
    await ensureTickets(tenantId, Math.max(5, targetCount / 10));
  }
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId } });
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  const seedUser = users[0];

  if ((await prisma.itsm_attachments.count()) === 0 && tickets.length > 0 && seedUser) {
    const payload = Array.from({ length: targetCount }).map((_, i) => ({
      ticketId: tickets[i % tickets.length].id,
      fileName: `anexo-seed-${i + 1}.pdf`,
      fileUrl: `https://storage.seed/${i + 1}.pdf`,
      fileSize: 120000,
      mimeType: 'application/pdf',
      uploadedBy: seedUser.id,
    }));
    await prisma.itsm_attachments.createMany({ data: payload });
  }

  if ((await prisma.iTSM_ChatLog.count({ where: { tenantId } })) === 0 && seedUser) {
    const payload = Array.from({ length: targetCount }).map((_, i) => ({
      tenantId,
      userId: seedUser.id,
      ticketId: tickets[i % tickets.length]?.id,
      messages: [{ role: 'user', content: 'Seed chat' }],
      sessionId: `session-${i + 1}`,
      context: { source: 'seed' },
      wasHelpful: true,
      ticketCreated: Boolean(tickets[i % tickets.length]),
      updatedAt: new Date(),
    }));
    await prisma.iTSM_ChatLog.createMany({ data: payload });
  }

  if ((await prisma.itsm_query_logs.count()) === 0 && seedUser) {
    const payload = Array.from({ length: targetCount }).map((_, i) => ({
      query: `SELECT * FROM seed_table_${i + 1}`,
      duration: faker.number.int({ min: 5, max: 1200 }),
      success: true,
      userId: seedUser.id,
      endpoint: '/api/seed',
      method: 'GET',
      ipAddress: faker.internet.ip(),
    }));
    await prisma.itsm_query_logs.createMany({ data: payload });
  }

  // PaymentMethods
  if ((await prisma.paymentMethod.count()) === 0) {
    await ensureBidderProfiles(tenantId, deps, Math.max(10, targetCount / 5));
    const bidders = await prisma.bidderProfile.findMany({ where: { tenantId } });
    for (let i = 0; i < targetCount; i++) {
      const bidder = bidders[i % bidders.length];
      await deps.paymentMethodService.createPaymentMethod({
        bidderId: bidder.id,
        type: 'PIX' as any,
        isDefault: i === 0,
        pixKey: `pix-${i + 1}@seed.com`,
        pixKeyType: 'EMAIL',
        isActive: true,
      } as any);
    }
  }

  // ParticipationHistory
  if ((await prisma.participationHistory.count({ where: { tenantId } })) === 0) {
    await ensureBidderProfiles(tenantId, deps, Math.max(10, targetCount / 5));
    const bidders = await prisma.bidderProfile.findMany({ where: { tenantId } });
    const lots = await prisma.lot.findMany({ where: { tenantId }, take: 20 });
    const auctions = await prisma.auction.findMany({ where: { tenantId }, take: 10 });

    if (lots.length > 0 && auctions.length > 0 && bidders.length > 0) {
      const payload = Array.from({ length: targetCount }).map((_, i) => ({
        bidderId: bidders[i % bidders.length].id,
        lotId: lots[i % lots.length].id,
        auctionId: auctions[i % auctions.length].id,
        title: lots[i % lots.length].title,
        auctionName: auctions[i % auctions.length].title,
        maxBid: faker.number.int({ min: 1000, max: 10000 }),
        finalBid: faker.number.int({ min: 1000, max: 10000 }),
        result: 'WON' as any,
        tenantId,
      }));
      await prisma.participation_history.createMany({ data: payload });
    }
  }

  // PLATFORM SETTINGS & SUB-SETTINGS (Garante que configurações existam)
  let platformSettings = await prisma.platformSettings.findUnique({
    where: { tenantId }
  });

  if (!platformSettings) {
    platformSettings = await prisma.platformSettings.create({
      data: {
        tenantId,
        siteTitle: 'BidExpert Seed',
        isSetupComplete: true,
        primaryColorHsl: '221.2 83.2% 53.3%', // azul padrão
      }
    });
  }

  // Helpers para criar settings se não existirem
  const ensureSetting = async (model: any, data: any) => {
    const existing = await model.findUnique({ where: { platformSettingsId: platformSettings!.id } });
    if (!existing) {
      await model.create({ data: { ...data, platformSettingsId: platformSettings!.id } });
    }
  };

  await ensureSetting(prisma.biddingSettings, {
    instantBiddingEnabled: true,
    getBidInfoInstantly: true,
    biddingInfoCheckIntervalSeconds: 1,
  });

  await ensureSetting(prisma.mapSettings, {
    defaultProvider: 'openstreetmap',
  });

  await ensureSetting(prisma.notificationSettings, {
    notifyOnNewAuction: true,
    notifyOnAuctionEndingSoon: true,
  });

  await ensureSetting(prisma.idMasks, {
    auctionCodeMask: 'AUC-####',
    lotCodeMask: 'LOT-####',
  });

  await ensureSetting(prisma.mentalTriggerSettings, {
    showHotBidBadge: true,
    hotBidThreshold: 5,
  });

  await ensureSetting(prisma.paymentGatewaySettings, {
    defaultGateway: 'Manual',
    platformCommissionPercentage: 5.0,
  });

  await ensureSetting(prisma.realtimeSettings, {
    softCloseEnabled: true,
    softCloseMinutes: 2,
  });

  await ensureSetting(prisma.sectionBadgeVisibility, {
    searchGrid: { show: true },
    lotDetail: { show: true },
  });

  // VariableIncrementRule (1..N)
  if ((await prisma.variableIncrementRule.count({ where: { platformSettingsId: platformSettings.id } })) === 0) {
    await prisma.variableIncrementRule.createMany({
      data: [
        { platformSettingsId: platformSettings.id, from: 0, to: 1000, increment: 50 },
        { platformSettingsId: platformSettings.id, from: 1000, to: 10000, increment: 100 },
        { platformSettingsId: platformSettings.id, from: 10000, to: null, increment: 500 },
      ]
    });
  }

  // LotStagePrice (Dados de exemplo para estágios de lote)
  if ((await prisma.lotStagePrice.count({ where: { tenantId } })) === 0) {
    const lots = await prisma.lot.findMany({ where: { tenantId }, take: 10, include: { Auction: true } });
    const stages = await prisma.auctionStage.findMany({ where: { tenantId }, take: 5 });
    
    if (lots.length > 0 && stages.length > 0) {
        const payload = [];
        for(const lot of lots) {
            const stage = stages[0]; // simplificado
            payload.push({
                lotId: lot.id,
                auctionId: lot.auctionId,
                auctionStageId: stage.id,
                initialBid: faker.number.float({ min: 100, max: 5000 }),
                bidIncrement: 50.0,
                tenantId
            });
        }
        await prisma.lotStagePrice.createMany({ data: payload });
    }
  }

  // UserLotMaxBid (Lances automáticos)
  if ((await prisma.userLotMaxBid.count({ where: { tenantId } })) === 0) {
    // Requer usuários (bidders) e lotes
    const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
    const lots = await prisma.lot.findMany({ where: { tenantId }, take: 5 });
    
    if (users.length > 0 && lots.length > 0) {
         const payload = lots.map((lot, i) => ({
             userId: users[i % users.length].id,
             lotId: lot.id,
             maxAmount: faker.number.float({ min: 5000, max: 20000 }),
             isActive: true,
             tenantId
         }));
         await prisma.userLotMaxBid.createMany({ data: payload });
    }
  }
}
