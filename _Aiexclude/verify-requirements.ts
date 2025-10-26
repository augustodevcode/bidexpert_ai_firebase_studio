import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRequirements() {
  console.log('Verificando se os requisitos foram atendidos...\n');
  
  // Check counts
  const assetsCount = await prisma.asset.count();
  const lotsCount = await prisma.lot.count();
  const auctionsCount = await prisma.auction.count();
  const categoriesCount = await prisma.lotCategory.count();
  const winsCount = await prisma.userWin.count();
  
  console.log('=== VERIFICAÇÃO DE REQUISITOS ===');
  console.log(`Ativos ativos (>= 2000): ${assetsCount >= 2000 ? '✅' : '❌'} (${assetsCount})`);
  console.log(`Lotes (>= 1000): ${lotsCount >= 1000 ? '✅' : '❌'} (${lotsCount})`);
  console.log(`Leilões (>= 500): ${auctionsCount >= 500 ? '✅' : '❌'} (${auctionsCount})`);
  console.log(`Categorias (>= 20): ${categoriesCount >= 20 ? '✅' : '❌'} (${categoriesCount})`);
  console.log(`Arrematantes com pagamento (>= 100): ${winsCount >= 100 ? '✅' : '❌'} (${winsCount})`);
  
  if (assetsCount >= 2000 && lotsCount >= 1000 && auctionsCount >= 500 && categoriesCount >= 20 && winsCount >= 100) {
    console.log('\n🎉 TODOS OS REQUISITOS FORAM ATENDIDOS!');
  } else {
    console.log('\n⚠️  Alguns requisitos ainda não foram atendidos. Execute o script de seed novamente.');
  }
  
  await prisma.$disconnect();
}

verifyRequirements().catch(e => {
  console.error(e);
  process.exit(1);
});