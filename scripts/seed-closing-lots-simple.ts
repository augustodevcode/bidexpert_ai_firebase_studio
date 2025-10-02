import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Criando lotes encerrando em breve...\n');

  try {
    const auctions = await prisma.auction.findMany({ where: { status: 'ABERTO_PARA_LANCES' }, take: 3 });
    const cities = await prisma.city.findMany({ include: { state: true }, take: 5 });

    if (auctions.length === 0 || cities.length === 0) {
      console.log('⚠️  Dados insuficientes.');
      return;
    }

    let created = 0;

    // Criar lotes encerrando em diferentes períodos
    const timeframes = [
      { hours: 12, title: 'Veículo Urgente' },
      { hours: 24, title: 'Imóvel 1 Dia' },
      { hours: 48, title: 'Eletrônico 2 Dias' },
      { hours: 72, title: 'Veículo 3 Dias' },
      { hours: 120, title: 'Imóvel 5 Dias' },
      { hours: 168, title: 'Eletrônico 7 Dias' },
    ];

    for (const tf of timeframes) {
      const auction = auctions[Math.floor(Math.random() * auctions.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      const now = new Date();
      const endDate = new Date(now.getTime() + tf.hours * 60 * 60 * 1000);
      const startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const originalPrice = 50000 + Math.floor(Math.random() * 50000);
      const discountedPrice = Math.floor(originalPrice * 0.5);

      try {
        await prisma.lot.create({
          data: {
            auctionId: auction.id,
            title: `${tf.title} - 2ª Praça`,
            description: 'Lote em segunda praça com 50% de desconto!',
            price: discountedPrice,
            initialPrice: originalPrice,
            status: 'ABERTO_PARA_LANCES',
            type: 'Diversos',
            endDate,
            cityId: city.id,
            cityName: city.name,
            stateId: city.stateId,
            stateUf: city.state.uf,
            tenantId: auction.tenantId,
          },
        });
        created++;
        console.log(`  ✅ ${tf.title} (${tf.hours}h)`);
      } catch (e) {
        console.log(`  ❌ Erro: ${e}`);
      }
    }

    console.log(`\n✅ ${created} lotes criados!\n`);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
