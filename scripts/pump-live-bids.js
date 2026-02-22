const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const auctionPublicId = process.argv[2];
  const lotPublicId = process.argv[3];
  const loops = Number(process.argv[4] || 24);
  const intervalMs = Number(process.argv[5] || 5000);

  if (!auctionPublicId || !lotPublicId) {
    throw new Error('Uso: node scripts/pump-live-bids.js <auctionPublicId> <lotPublicId> [loops] [intervalMs]');
  }

  const auction = await prisma.auction.findUnique({ where: { publicId: auctionPublicId } });
  if (!auction) throw new Error(`Leilão não encontrado: ${auctionPublicId}`);

  const lot = await prisma.lot.findUnique({ where: { publicId: lotPublicId } });
  if (!lot) throw new Error(`Lote não encontrado: ${lotPublicId}`);

  const tenantUsers = await prisma.userOnTenant.findMany({
    where: { tenantId: lot.tenantId },
    include: { User: true },
    take: 15,
    orderBy: { userId: 'asc' },
  });

  const users = tenantUsers.map((u) => u.User).filter(Boolean);
  if (users.length < 2) throw new Error('Não há usuários suficientes para gerar lances.');

  const bidStep = Number(lot.bidIncrementStep || 2500);
  let currentPrice = Number(lot.price || lot.initialPrice || 1000);

  console.log(`[pump-live-bids] Iniciando ${loops} lances para lote ${lotPublicId} (intervalo ${intervalMs}ms)`);

  for (let i = 0; i < loops; i++) {
    const user = users[i % users.length];
    currentPrice += bidStep;

    await prisma.bid.create({
      data: {
        lotId: lot.id,
        auctionId: auction.id,
        bidderId: user.id,
        amount: currentPrice,
        status: 'ATIVO',
        isAutoBid: true,
        bidderDisplay: user.fullName || user.email || `User ${user.id}`,
        tenantId: lot.tenantId,
        timestamp: new Date(),
      },
    });

    await prisma.lot.update({
      where: { id: lot.id },
      data: {
        price: currentPrice,
        bidsCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    console.log(`[pump-live-bids] Lance ${i + 1}/${loops} | ${user.email || user.fullName} | R$ ${currentPrice}`);
    await sleep(intervalMs);
  }

  console.log('[pump-live-bids] Finalizado.');
}

main()
  .catch((error) => {
    console.error('[pump-live-bids] erro:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
