import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🚀 Criando lotes com etapas encerrando em breve...\n');

  try {
    const cities = await prisma.city.findMany({ include: { state: true }, take: 5 });
    
    if (cities.length === 0) {
      console.log('⚠️  Nenhuma cidade encontrada.');
      return;
    }

    let created = 0;

    // Criar leilões com etapas encerrando em diferentes períodos
    const timeframes = [
      { hours: 12, title: 'Leilão Urgente' },
      { hours: 24, title: 'Leilão 1 Dia' },
      { hours: 48, title: 'Leilão 2 Dias' },
      { hours: 72, title: 'Leilão 3 Dias' },
      { hours: 120, title: 'Leilão 5 Dias' },
      { hours: 168, title: 'Leilão 7 Dias' },
    ];

    for (const tf of timeframes) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      const now = new Date();
      const stageEndDate = new Date(now.getTime() + tf.hours * 60 * 60 * 1000);
      const stageStartDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      try {
        // Criar leilão
        const auction = await prisma.auction.create({
          data: {
            title: `${tf.title} - 2ª Praça`,
            description: 'Leilão em segunda praça com descontos!',
            status: 'ABERTO_PARA_LANCES',
            auctionType: 'EXTRAJUDICIAL',
            cityId: city.id,
            stateId: city.stateId,
            tenantId: 1n,
          },
        });

        // Criar etapa (2ª Praça)
        await prisma.auctionStage.create({
          data: {
            auctionId: auction.id,
            name: '2ª Praça',
            startDate: stageStartDate,
            endDate: stageEndDate,
          },
        });

        // Criar 2 lotes para este leilão
        for (let i = 1; i <= 2; i++) {
          const originalPrice = 50000 + Math.floor(Math.random() * 50000);
          const discountedPrice = Math.floor(originalPrice * 0.5);

          await prisma.lot.create({
            data: {
              auctionId: auction.id,
              title: `Lote ${i} - ${tf.title}`,
              description: 'Lote em 2ª praça com 50% de desconto!',
              price: discountedPrice,
              initialPrice: originalPrice,
              status: 'ABERTO_PARA_LANCES',
              type: 'Diversos',
              cityId: city.id,
              cityName: city.name,
              stateId: city.stateId,
              stateUf: city.state.uf,
              tenantId: 1n,
            },
          });
          created++;
        }

        console.log(`  ✅ ${tf.title} (${tf.hours}h) - 2 lotes criados`);
      } catch (e) {
        console.log(`  ❌ Erro: ${e}`);
      }
    }

    console.log(`\n✅ ${created} lotes criados com etapas!\n`);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
