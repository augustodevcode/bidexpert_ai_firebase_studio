import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando Etapas de Leilões...\n');

  // Buscar etapas
  const stages = await prisma.auctionStage.findMany({
    include: {
      auction: {
        select: { id: true, title: true, status: true }
      }
    },
    orderBy: { endDate: 'asc' },
    take: 10,
  });

  console.log(`📊 Total de etapas: ${stages.length}\n`);

  if (stages.length > 0) {
    console.log('📋 Primeiras 10 etapas:');
    stages.forEach(stage => {
      console.log(`\n  Etapa: ${stage.name}`);
      console.log(`  Leilão: ${stage.auction.title}`);
      console.log(`  Status: ${stage.auction.status}`);
      console.log(`  Início: ${new Date(stage.startDate).toLocaleString('pt-BR')}`);
      console.log(`  Fim: ${new Date(stage.endDate).toLocaleString('pt-BR')}`);
    });
  }

  // Buscar lotes com seus leilões e etapas
  console.log('\n\n🔍 Verificando Lotes com Etapas...\n');

  const lotsWithStages = await prisma.lot.findMany({
    where: {
      status: 'ABERTO_PARA_LANCES',
      auction: {
        stages: {
          some: {}
        }
      }
    },
    include: {
      auction: {
        include: {
          stages: {
            orderBy: { endDate: 'desc' },
            take: 1, // Última etapa
          }
        }
      }
    },
    take: 10,
  });

  console.log(`📊 Lotes abertos com etapas: ${lotsWithStages.length}\n`);

  if (lotsWithStages.length > 0) {
    console.log('📋 Lotes e suas últimas etapas:');
    lotsWithStages.forEach(lot => {
      const lastStage = lot.auction?.stages[0];
      console.log(`\n  Lote: ${lot.title}`);
      console.log(`  Leilão: ${lot.auction?.title}`);
      if (lastStage) {
        console.log(`  Última Etapa: ${lastStage.name}`);
        console.log(`  Encerra em: ${new Date(lastStage.endDate).toLocaleString('pt-BR')}`);
      } else {
        console.log(`  ⚠️  SEM ETAPAS!`);
      }
    });
  }

  await prisma.$disconnect();
}

main();
