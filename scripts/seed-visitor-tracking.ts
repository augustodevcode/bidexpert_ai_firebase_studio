/**
 * @fileoverview Script para popular dados de visitantes e métricas de visualização.
 * 
 * Este script cria dados mock para testar o sistema de tracking de visitantes:
 * - Visitantes com diferentes dispositivos e localizações
 * - Sessões de navegação
 * - Eventos de visualização de lotes e leilões
 * - Métricas agregadas
 * 
 * REGRAS:
 * - Não duplica visitantes com o mesmo visitorId
 * - Gera dados realistas de distribuição temporal
 * - Simula diferentes padrões de uso (mobile vs desktop)
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Tipo para evento de visualização
type VisitorEventTypeValue = 'PAGE_VIEW' | 'LOT_VIEW' | 'AUCTION_VIEW' | 'SEARCH' | 'FILTER_APPLIED' | 'BID_CLICK' | 'SHARE_CLICK' | 'FAVORITE_ADD' | 'FAVORITE_REMOVE' | 'DOCUMENT_DOWNLOAD' | 'IMAGE_VIEW' | 'VIDEO_PLAY' | 'CONTACT_CLICK' | 'HABILITATION_START';

const prisma = new PrismaClient();

// Configurações
const NUM_VISITORS = 50;
const NUM_SESSIONS_PER_VISITOR_MIN = 1;
const NUM_SESSIONS_PER_VISITOR_MAX = 5;
const NUM_EVENTS_PER_SESSION_MIN = 2;
const NUM_EVENTS_PER_SESSION_MAX = 15;

// Dados mock para geração
const COUNTRIES = ['Brasil', 'Brasil', 'Brasil', 'Argentina', 'Estados Unidos', 'Portugal'];
const REGIONS = ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Paraná', 'Santa Catarina', 'Rio Grande do Sul'];
const CITIES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Florianópolis', 'Porto Alegre', 'Maringá', 'Londrina'];
const DEVICE_TYPES = ['desktop', 'desktop', 'mobile', 'mobile', 'mobile', 'tablet'];
const BROWSERS = ['Chrome', 'Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
const OS_OPTIONS = ['Windows', 'Windows', 'macOS', 'Android', 'iOS', 'Linux'];

const UTM_SOURCES = ['google', 'facebook', 'instagram', 'direct', 'email', null];
const UTM_MEDIUMS = ['cpc', 'organic', 'social', 'referral', 'email', null];
const UTM_CAMPAIGNS = ['black_friday', 'retargeting', 'brand', 'remarketing', null];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const diff = now.getTime() - pastDate.getTime();
  return new Date(pastDate.getTime() + Math.random() * diff);
}

async function getLotIds(): Promise<{ id: bigint; publicId: string | null; tenantId: bigint }[]> {
  const lots = await prisma.lot.findMany({
    select: { id: true, publicId: true, tenantId: true },
    take: 20
  });
  return lots;
}

async function getAuctionIds(): Promise<{ id: bigint; publicId: string | null; tenantId: bigint }[]> {
  const auctions = await prisma.auction.findMany({
    select: { id: true, publicId: true, tenantId: true },
    take: 10
  });
  return auctions;
}

async function seedVisitorTracking() {
  console.log('🔄 Iniciando seed de tracking de visitantes...\n');

  // Obter IDs de lotes e leilões existentes
  const lots = await getLotIds();
  const auctions = await getAuctionIds();

  if (lots.length === 0) {
    console.log('⚠️  Nenhum lote encontrado. Por favor, execute o seed de lotes primeiro.');
    return;
  }

  console.log(`📦 Encontrados ${lots.length} lotes e ${auctions.length} leilões para vincular eventos.\n`);

  // Criar visitantes
  console.log(`👥 Criando ${NUM_VISITORS} visitantes...`);
  const visitors: { id: bigint; visitorId: string }[] = [];

  for (let i = 0; i < NUM_VISITORS; i++) {
    const visitorId = uuidv4();
    const deviceType = randomElement(DEVICE_TYPES);
    const firstVisit = randomDate(30);

    try {
      const visitor = await prisma.visitor.create({
        data: {
          visitorId,
          firstVisitAt: firstVisit,
          lastVisitAt: firstVisit,
          firstUserAgent: `Mozilla/5.0 (${deviceType === 'mobile' ? 'iPhone; CPU iPhone OS' : 'Windows NT 10.0'})`,
          firstIpAddress: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          firstReferrer: Math.random() > 0.5 ? 'https://www.google.com/' : null,
          country: randomElement(COUNTRIES),
          region: randomElement(REGIONS),
          city: randomElement(CITIES),
          deviceType,
          browser: randomElement(BROWSERS),
          os: randomElement(OS_OPTIONS),
          totalVisits: 1,
          totalPageViews: 0,
          totalEvents: 0,
        }
      });

      visitors.push({ id: visitor.id, visitorId: visitor.visitorId });
    } catch (error) {
      // Visitante já existe, ignorar
      console.log(`⚠️  Visitante ${visitorId} já existe, pulando...`);
    }
  }

  console.log(`✅ ${visitors.length} visitantes criados.\n`);

  // Criar sessões e eventos para cada visitante
  console.log('📊 Criando sessões e eventos...');
  let totalSessions = 0;
  let totalEvents = 0;

  for (const visitor of visitors) {
    const numSessions = randomInt(NUM_SESSIONS_PER_VISITOR_MIN, NUM_SESSIONS_PER_VISITOR_MAX);

    for (let s = 0; s < numSessions; s++) {
      const sessionStart = randomDate(30);
      const sessionId = uuidv4();

      const session = await prisma.visitorSession.create({
        data: {
          sessionId,
          visitorId: visitor.id,
          startedAt: sessionStart,
          lastActivityAt: sessionStart,
          userAgent: `Mozilla/5.0 (compatible)`,
          ipAddress: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          referrer: Math.random() > 0.7 ? 'https://www.google.com/' : null,
          utmSource: randomElement(UTM_SOURCES),
          utmMedium: randomElement(UTM_MEDIUMS),
          utmCampaign: randomElement(UTM_CAMPAIGNS),
          pageViews: 0,
          eventsCount: 0,
        }
      });

      totalSessions++;

      // Criar eventos para esta sessão
      const numEvents = randomInt(NUM_EVENTS_PER_SESSION_MIN, NUM_EVENTS_PER_SESSION_MAX);
      let eventTimestamp = new Date(sessionStart);

      for (let e = 0; e < numEvents; e++) {
        // Incrementar timestamp do evento (1-5 minutos entre eventos)
        eventTimestamp = new Date(eventTimestamp.getTime() + randomInt(60000, 300000));

        // Escolher tipo de evento (mais visualizações de lotes)
        const eventTypeRoll = Math.random();
        let eventType: VisitorEventTypeValue;
        let entityType: string | null = null;
        let entityId: bigint | null = null;
        let entityPublicId: string | null = null;

        if (eventTypeRoll < 0.5) {
          // Visualização de lote
          eventType = 'LOT_VIEW';
          const lot = randomElement(lots);
          entityType = 'Lot';
          entityId = lot.id;
          entityPublicId = lot.publicId;
        } else if (eventTypeRoll < 0.7) {
          // Visualização de leilão
          eventType = 'AUCTION_VIEW';
          if (auctions.length > 0) {
            const auction = randomElement(auctions);
            entityType = 'Auction';
            entityId = auction.id;
            entityPublicId = auction.publicId;
          } else {
            eventType = 'PAGE_VIEW';
          }
        } else if (eventTypeRoll < 0.85) {
          // Busca
          eventType = 'SEARCH';
        } else if (eventTypeRoll < 0.9) {
          // Clique em lance
          eventType = 'BID_CLICK';
          const lot = randomElement(lots);
          entityType = 'Lot';
          entityId = lot.id;
          entityPublicId = lot.publicId;
        } else {
          // Page view genérico
          eventType = 'PAGE_VIEW';
        }

        await prisma.visitorEvent.create({
          data: {
            eventId: uuidv4(),
            visitorId: visitor.id,
            sessionId: session.id,
            eventType,
            entityType,
            entityId,
            entityPublicId,
            pageUrl: `https://bidexpert.com.br/${entityType?.toLowerCase() || 'home'}${entityPublicId ? `/${entityPublicId}` : ''}`,
            metadata: eventType === 'SEARCH' ? { searchTerm: randomElement(['carro', 'imovel', 'maquinas', 'eletronicos']) } : undefined,
            timestamp: eventTimestamp,
          }
        });

        totalEvents++;
      }

      // Atualizar contadores da sessão
      await prisma.visitorSession.update({
        where: { id: session.id },
        data: {
          eventsCount: numEvents,
          pageViews: numEvents,
          lastActivityAt: eventTimestamp,
          duration: Math.floor((eventTimestamp.getTime() - sessionStart.getTime()) / 1000),
        }
      });
    }

    // Atualizar contadores do visitante
    const visitorStats = await prisma.visitorSession.aggregate({
      where: { visitorId: visitor.id },
      _sum: { pageViews: true, eventsCount: true },
      _count: { id: true },
    });

    await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        totalVisits: visitorStats._count.id,
        totalPageViews: visitorStats._sum.pageViews || 0,
        totalEvents: visitorStats._sum.eventsCount || 0,
        lastVisitAt: new Date(),
      }
    });
  }

  console.log(`✅ ${totalSessions} sessões e ${totalEvents} eventos criados.\n`);

  // Calcular e criar métricas agregadas por entidade
  console.log('📈 Calculando métricas agregadas...');

  // Métricas para lotes
  for (const lot of lots) {
    const viewEvents = await prisma.visitorEvent.findMany({
      where: {
        entityType: 'Lot',
        entityId: lot.id,
        eventType: 'LOT_VIEW',
      },
      select: { visitorId: true, timestamp: true }
    });

    const uniqueVisitors = new Set(viewEvents.map(e => e.visitorId.toString())).size;
    const totalViews = viewEvents.length;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const views24h = viewEvents.filter(e => e.timestamp >= last24h).length;
    const views7d = viewEvents.filter(e => e.timestamp >= last7d).length;
    const views30d = viewEvents.filter(e => e.timestamp >= last30d).length;

    await prisma.entityViewMetrics.upsert({
      where: {
        entityType_entityId: { entityType: 'Lot', entityId: lot.id }
      },
      update: {
        totalViews,
        uniqueViews: uniqueVisitors,
        viewsLast24h: views24h,
        viewsLast7d: views7d,
        viewsLast30d: views30d,
        lastViewedAt: viewEvents.length > 0 ? viewEvents[viewEvents.length - 1].timestamp : null,
      },
      create: {
        entityType: 'Lot',
        entityId: lot.id,
        entityPublicId: lot.publicId,
        tenantId: lot.tenantId,
        totalViews,
        uniqueViews: uniqueVisitors,
        viewsLast24h: views24h,
        viewsLast7d: views7d,
        viewsLast30d: views30d,
        lastViewedAt: viewEvents.length > 0 ? viewEvents[viewEvents.length - 1].timestamp : null,
      }
    });

    // Atualizar campo views no lote
    await prisma.lot.update({
      where: { id: lot.id },
      data: { views: totalViews }
    });
  }

  // Métricas para leilões
  for (const auction of auctions) {
    const viewEvents = await prisma.visitorEvent.findMany({
      where: {
        entityType: 'Auction',
        entityId: auction.id,
        eventType: 'AUCTION_VIEW',
      },
      select: { visitorId: true, timestamp: true }
    });

    const uniqueVisitors = new Set(viewEvents.map(e => e.visitorId.toString())).size;
    const totalViews = viewEvents.length;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const views24h = viewEvents.filter(e => e.timestamp >= last24h).length;
    const views7d = viewEvents.filter(e => e.timestamp >= last7d).length;
    const views30d = viewEvents.filter(e => e.timestamp >= last30d).length;

    await prisma.entityViewMetrics.upsert({
      where: {
        entityType_entityId: { entityType: 'Auction', entityId: auction.id }
      },
      update: {
        totalViews,
        uniqueViews: uniqueVisitors,
        viewsLast24h: views24h,
        viewsLast7d: views7d,
        viewsLast30d: views30d,
        lastViewedAt: viewEvents.length > 0 ? viewEvents[viewEvents.length - 1].timestamp : null,
      },
      create: {
        entityType: 'Auction',
        entityId: auction.id,
        entityPublicId: auction.publicId,
        tenantId: auction.tenantId,
        totalViews,
        uniqueViews: uniqueVisitors,
        viewsLast24h: views24h,
        viewsLast7d: views7d,
        viewsLast30d: views30d,
        lastViewedAt: viewEvents.length > 0 ? viewEvents[viewEvents.length - 1].timestamp : null,
      }
    });
  }

  console.log('✅ Métricas agregadas calculadas.\n');

  // Resumo final
  const visitorCount = await prisma.visitor.count();
  const sessionCount = await prisma.visitorSession.count();
  const eventCount = await prisma.visitorEvent.count();
  const metricsCount = await prisma.entityViewMetrics.count();

  console.log('═══════════════════════════════════════════');
  console.log('📊 RESUMO DO SEED DE TRACKING');
  console.log('═══════════════════════════════════════════');
  console.log(`   Visitantes criados:      ${visitorCount}`);
  console.log(`   Sessões criadas:         ${sessionCount}`);
  console.log(`   Eventos registrados:     ${eventCount}`);
  console.log(`   Métricas agregadas:      ${metricsCount}`);
  console.log('═══════════════════════════════════════════\n');

  console.log('✅ Seed de tracking de visitantes concluído com sucesso!');
}

// Função para limpar dados de tracking (usar com cuidado!)
async function clearVisitorTracking() {
  console.log('🗑️  Limpando dados de tracking...');

  await prisma.visitorEvent.deleteMany({});
  await prisma.visitorSession.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.entityViewMetrics.deleteMany({});

  console.log('✅ Dados de tracking limpos.\n');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  try {
    if (shouldClear) {
      await clearVisitorTracking();
    }

    await seedVisitorTracking();
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
