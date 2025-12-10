/**
 * @fileoverview Script para verificar dados de tracking no banco de dados.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTrackingData() {
  console.log('🔍 Verificando dados de tracking no banco de dados...\n');

  // Contadores gerais
  const visitorCount = await prisma.visitor.count();
  const sessionCount = await prisma.visitorSession.count();
  const eventCount = await prisma.visitorEvent.count();
  const metricsCount = await prisma.entityViewMetrics.count();

  console.log('═══════════════════════════════════════════');
  console.log('📊 CONTADORES GERAIS');
  console.log('═══════════════════════════════════════════');
  console.log(`   Visitantes:              ${visitorCount}`);
  console.log(`   Sessões:                 ${sessionCount}`);
  console.log(`   Eventos:                 ${eventCount}`);
  console.log(`   Métricas agregadas:      ${metricsCount}`);
  console.log('═══════════════════════════════════════════\n');

  // Amostra de visitantes
  console.log('👥 AMOSTRA DE VISITANTES (5 primeiros):');
  console.log('─────────────────────────────────────────');
  const visitors = await prisma.visitor.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      visitorId: true,
      country: true,
      city: true,
      deviceType: true,
      browser: true,
      totalVisits: true,
      totalPageViews: true,
      totalEvents: true,
    }
  });

  visitors.forEach((v, i) => {
    console.log(`\n  ${i + 1}. ID: ${v.id}`);
    console.log(`     Cookie ID: ${v.visitorId.substring(0, 8)}...`);
    console.log(`     Local: ${v.city}, ${v.country}`);
    console.log(`     Dispositivo: ${v.deviceType} / ${v.browser}`);
    console.log(`     Visitas: ${v.totalVisits} | PageViews: ${v.totalPageViews} | Eventos: ${v.totalEvents}`);
  });

  // Amostra de métricas de lotes
  console.log('\n\n📈 MÉTRICAS DE LOTES (5 mais visualizados):');
  console.log('─────────────────────────────────────────');
  const lotMetrics = await prisma.entityViewMetrics.findMany({
    where: { entityType: 'Lot' },
    take: 5,
    orderBy: { totalViews: 'desc' },
  });

  for (const m of lotMetrics) {
    const lot = await prisma.lot.findUnique({
      where: { id: m.entityId },
      select: { title: true, publicId: true }
    });

    console.log(`\n  Lote: ${lot?.title?.substring(0, 40) || 'N/A'}...`);
    console.log(`     PublicId: ${m.entityPublicId || lot?.publicId || 'N/A'}`);
    console.log(`     Total Views: ${m.totalViews}`);
    console.log(`     Únicos: ${m.uniqueViews}`);
    console.log(`     Últimas 24h: ${m.viewsLast24h} | 7d: ${m.viewsLast7d} | 30d: ${m.viewsLast30d}`);
  }

  // Distribuição de eventos por tipo
  console.log('\n\n📊 DISTRIBUIÇÃO DE EVENTOS POR TIPO:');
  console.log('─────────────────────────────────────────');
  const eventsByType = await prisma.visitorEvent.groupBy({
    by: ['eventType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  eventsByType.forEach(e => {
    console.log(`   ${e.eventType.padEnd(20)}: ${e._count.id}`);
  });

  // Distribuição de visitantes por país
  console.log('\n\n🌍 DISTRIBUIÇÃO DE VISITANTES POR PAÍS:');
  console.log('─────────────────────────────────────────');
  const visitorsByCountry = await prisma.visitor.groupBy({
    by: ['country'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  visitorsByCountry.forEach(v => {
    console.log(`   ${(v.country || 'Desconhecido').padEnd(20)}: ${v._count.id}`);
  });

  // Distribuição por dispositivo
  console.log('\n\n📱 DISTRIBUIÇÃO POR DISPOSITIVO:');
  console.log('─────────────────────────────────────────');
  const visitorsByDevice = await prisma.visitor.groupBy({
    by: ['deviceType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  visitorsByDevice.forEach(v => {
    console.log(`   ${(v.deviceType || 'Desconhecido').padEnd(20)}: ${v._count.id}`);
  });

  // Verificar se campo views dos lotes foi atualizado
  console.log('\n\n🔢 VERIFICAÇÃO DO CAMPO VIEWS NOS LOTES:');
  console.log('─────────────────────────────────────────');
  const lotsWithViews = await prisma.lot.findMany({
    where: { views: { gt: 0 } },
    take: 5,
    orderBy: { views: 'desc' },
    select: { id: true, title: true, publicId: true, views: true }
  });

  lotsWithViews.forEach(l => {
    console.log(`   ${l.publicId || l.id}: ${l.views} views - ${l.title?.substring(0, 30)}...`);
  });

  console.log('\n\n✅ Verificação concluída!');
}

verifyTrackingData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
