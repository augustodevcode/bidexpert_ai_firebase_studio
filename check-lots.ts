import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const publicId = 'AUC-792d9924-b376-46da-baa6-02d3d6b065d4';
  
  console.log(`\n🔍 Buscando leilão com publicId: ${publicId}\n`);

  // Find the auction by publicId (since the URL uses publicId)
  const auction = await prisma.auction.findFirst({
    where: { publicId },
    include: { lots: true }
  });

  if (!auction) {
    console.log('❌ Leilão não encontrado com esse publicId');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Leilão encontrado: ${auction.title}`);
  console.log(`   ID (BD): ${auction.id}`);
  console.log(`   PublicId: ${auction.publicId}`);
  console.log(`   Total de lotes (relação): ${auction.lots?.length ?? 0}`);

  // Query direct de lotes
  const lotsFromDb = await prisma.lot.findMany({
    where: { auctionId: auction.id },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n📊 Total de lotes na tabela (filtrado por auctionId): ${lotsFromDb.length}`);
  
  if (lotsFromDb.length > 0) {
    console.log('\n📋 Lotes encontrados:');
    lotsFromDb.forEach((lot, idx) => {
      console.log(`${idx + 1}. ${lot.title}`);
      console.log(`   ID: ${lot.id}`);
      console.log(`   Status: ${lot.status}`);
      console.log(`   Preço: ${lot.price}`);
      console.log('');
    });
  } else {
    console.log('\n⚠️  Nenhum lote encontrado para este leilão no banco de dados!');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
