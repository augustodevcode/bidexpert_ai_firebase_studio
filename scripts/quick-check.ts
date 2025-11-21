import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const auction = await prisma.auction.findFirst({
    where: { title: { contains: 'VEÍCULOS 01/2025' } },
    include: {
      lots: true,
      seller: true,
      auctioneer: true
    }
  });
  
  if (auction) {
    console.log('✅ LEILÃO CRIADO COM SUCESSO!');
    console.log(`Título: ${auction.title}`);
    console.log(`ID: ${auction.id}`);
    console.log(`Seller: ${auction.seller?.name}`);
    console.log(`Leiloeiro: ${auction.auctioneer?.name}`);
    console.log(`Lotes: ${auction.lots.length}`);
    if (auction.lots.length > 0) {
      console.log(`  - Lote #${auction.lots[0].number}: ${auction.lots[0].title}`);
    }
  } else {
    console.log('❌ Leilão não encontrado');
  }
  
  // Check bid
  const bid = await prisma.bid.findFirst({
    where: { amount: 3300 },
    include: { bidder: true, lot: true }
  });
  
  if (bid) {
    console.log('\n✅ LANCE CRIADO:');
    console.log(`Valor: R$ ${bid.amount}`);
    console.log(`Arrematante: ${bid.bidder.email}`);
    console.log(`Lote: ${bid.lot.title}`);
  }
}

main().finally(() => prisma.$disconnect());
