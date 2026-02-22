const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function randomId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { subdomain: 'demo' } })
    || await prisma.tenant.findFirst();

  if (!tenant) {
    throw new Error('Nenhum tenant encontrado.');
  }

  const auctioneer = await prisma.auctioneer.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { id: 'asc' },
  });

  if (!auctioneer) {
    throw new Error(`Nenhum leiloeiro encontrado no tenant ${tenant.id}.`);
  }

  const tenantUsers = await prisma.userOnTenant.findMany({
    where: { tenantId: tenant.id },
    orderBy: { userId: 'asc' },
    include: { User: true },
    take: 20,
  });

  const bidderUsers = tenantUsers
    .map((entry) => entry.User)
    .filter((user) => !!user);

  if (bidderUsers.length < 3) {
    throw new Error('Poucos usuários para simular lances.');
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 60 * 1000);

  const auction = await prisma.auction.create({
    data: {
      publicId: randomId('live-auction'),
      slug: randomId('leilao-ao-vivo').toLowerCase(),
      title: `Leilão ao Vivo - Últimos Momentos (${new Date().toLocaleTimeString('pt-BR')})`,
      description: 'Leilão preparado automaticamente para monitoramento ao vivo dos momentos finais.',
      status: 'ABERTO_PARA_LANCES',
      auctionDate: now,
      openDate: now,
      actualOpenDate: now,
      endDate,
      tenantId: tenant.id,
      auctioneerId: auctioneer.id,
      totalLots: 2,
      updatedAt: new Date(),
    },
  });

  await prisma.auctionStage.create({
    data: {
      name: 'Etapa Final Ao Vivo',
      startDate: now,
      endDate,
      status: 'EM_ANDAMENTO',
      discountPercent: 100,
      auctionId: auction.id,
      tenantId: tenant.id,
    },
  });

  const lot1 = await prisma.lot.create({
    data: {
      publicId: randomId('live-lot-1'),
      auctionId: auction.id,
      number: '001',
      title: 'SUV Premium 2023 - Blindado Nível IIIA',
      description: 'Lote em disputa final para demonstração de monitor ao vivo.',
      type: 'MOVENTE',
      status: 'ABERTO_PARA_LANCES',
      price: 185000,
      initialPrice: 150000,
      bidIncrementStep: 2500,
      bidsCount: 0,
      endDate,
      lotSpecificAuctionDate: now,
      auctioneerId: auctioneer.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    },
  });

  const lot2 = await prisma.lot.create({
    data: {
      publicId: randomId('live-lot-2'),
      auctionId: auction.id,
      number: '002',
      title: 'Cobertura 280m² Vista Mar - Centro',
      description: 'Segundo lote pronto para entrar no pregão.',
      type: 'IMOVEL',
      status: 'ABERTO_PARA_LANCES',
      price: 920000,
      initialPrice: 800000,
      bidIncrementStep: 10000,
      bidsCount: 0,
      endDate,
      lotSpecificAuctionDate: now,
      auctioneerId: auctioneer.id,
      tenantId: tenant.id,
      updatedAt: new Date(),
    },
  });

  let current = 185000;
  const seedBids = [
    { bidder: bidderUsers[0], increment: 2500 },
    { bidder: bidderUsers[1], increment: 5000 },
    { bidder: bidderUsers[2], increment: 2500 },
    { bidder: bidderUsers[3] || bidderUsers[0], increment: 7500 },
  ];

  for (const item of seedBids) {
    current += item.increment;
    await prisma.bid.create({
      data: {
        lotId: lot1.id,
        auctionId: auction.id,
        bidderId: item.bidder.id,
        amount: current,
        status: 'ATIVO',
        isAutoBid: true,
        bidderDisplay: item.bidder.fullName || item.bidder.email || `User ${item.bidder.id}`,
        tenantId: tenant.id,
        timestamp: new Date(),
      },
    });
  }

  await prisma.lot.update({
    where: { id: lot1.id },
    data: { price: current, bidsCount: seedBids.length, updatedAt: new Date() },
  });

  const payload = {
    tenantId: tenant.id.toString(),
    auctionId: auction.id.toString(),
    auctionPublicId: auction.publicId,
    lot1Id: lot1.id.toString(),
    lot1PublicId: lot1.publicId,
    lot2Id: lot2.id.toString(),
    lot2PublicId: lot2.publicId,
    auctioneerId: auctioneer.id.toString(),
    auctioneerName: auctioneer.name,
    endDate: endDate.toISOString(),
    monitorUrl: `http://demo.localhost:9005/auctions/${auction.publicId || auction.id.toString()}/monitor?lotId=${lot1.publicId || lot1.id.toString()}`,
  };

  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch((error) => {
    console.error('[setup-live-monitor-auction] erro:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
