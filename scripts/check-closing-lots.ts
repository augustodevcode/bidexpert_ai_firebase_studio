import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando lotes encerrando em breve...\n');

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  console.log(`📅 Data atual: ${now.toLocaleString('pt-BR')}`);
  console.log(`📅 Daqui 7 dias: ${sevenDaysFromNow.toLocaleString('pt-BR')}\n`);

  // Todos os lotes abertos
  const openLots = await prisma.lot.findMany({
    where: { status: 'ABERTO_PARA_LANCES' },
    select: { id: true, title: true, endDate: true },
  });

  console.log(`📊 Total de lotes ABERTO_PARA_LANCES: ${openLots.length}\n`);

  // Lotes com endDate
  const lotsWithEndDate = openLots.filter(l => l.endDate);
  console.log(`📊 Lotes com endDate: ${lotsWithEndDate.length}\n`);

  // Lotes encerrando nos próximos 7 dias
  const closingSoon = lotsWithEndDate.filter(lot => {
    const endDate = new Date(lot.endDate!);
    return endDate > now && endDate <= sevenDaysFromNow;
  });

  console.log(`⏰ Lotes encerrando nos próximos 7 dias: ${closingSoon.length}\n`);

  if (closingSoon.length > 0) {
    console.log('✅ Lotes encontrados:');
    closingSoon.forEach(lot => {
      const endDate = new Date(lot.endDate!);
      const hoursLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      console.log(`  - ${lot.title}`);
      console.log(`    Encerra em: ${endDate.toLocaleString('pt-BR')} (${hoursLeft}h)`);
    });
  } else {
    console.log('❌ Nenhum lote encontrado encerrando nos próximos 7 dias!');
    console.log('\n💡 Execute: npx tsx scripts/seed-closing-lots-simple.ts');
  }

  await prisma.$disconnect();
}

main();
