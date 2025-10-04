/**
 * Script para criar lotes encerrando em breve (próximos 7 dias)
 * com descontos de 50% (2ª Praça)
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Criando lotes encerrando em breve...\n');

  try {
    // Buscar dados necessários
    const auctions = await prisma.auction.findMany({ where: { status: 'ABERTO_PARA_LANCES' }, take: 5 });
    const assets = await prisma.asset.findMany({ where: { status: 'DISPONIVEL' }, take: 20 });
    const cities = await prisma.city.findMany({ include: { state: true }, take: 10 });

    if (auctions.length === 0 || assets.length === 0 || cities.length === 0) {
      console.log('⚠️  Dados insuficientes. Execute o seed principal primeiro.');
      return;
    }

    const admin = await prisma.user.findFirst({ 
      where: { roles: { some: { role: { name: 'ADMIN' } } } } 
    });

    let lotsCreated = 0;

    // Criar lotes encerrando em diferentes períodos
    const timeframes = [
      { hours: 12, label: '12 horas' },    // Urgente!
      { hours: 24, label: '1 dia' },       // Amanhã
      { hours: 48, label: '2 dias' },      // Daqui 2 dias
      { hours: 72, label: '3 dias' },      // Daqui 3 dias
      { hours: 120, label: '5 dias' },     // Daqui 5 dias
      { hours: 168, label: '7 dias' },     // Daqui 7 dias
    ];

    for (const timeframe of timeframes) {
      // Criar 2-3 lotes para cada período
      const numLots = faker.number.int({ min: 2, max: 3 });

      for (let i = 0; i < numLots && assets.length > 0; i++) {
        const auction = faker.helpers.arrayElement(auctions);
        const asset = assets.pop()!;
        const city = faker.helpers.arrayElement(cities);

        // Calcular datas
        const now = new Date();
        const endDate = new Date(now.getTime() + timeframe.hours * 60 * 60 * 1000);
        const startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // Começou há 10 dias

        // Preço com 50% de desconto (2ª Praça)
        const originalPrice = faker.number.int({ min: 10000, max: 100000 });
        const discountedPrice = Math.floor(originalPrice * 0.5); // 50% OFF

        try {
          const lot = await prisma.lot.create({
            data: {
              auctionId: auction.id,
              title: `${asset.title} - 2ª Praça`,
              description: `${asset.description || 'Lote em segunda praça'} - Desconto de 50%!`,
              price: discountedPrice,
              initialPrice: originalPrice,
              status: 'ABERTO_PARA_LANCES',
              type: asset.categoryId || 'Diversos',
              startDate,
              endDate,
              cityId: city.id,
              cityName: city.name,
              stateId: city.stateId,
              stateUf: city.state.uf,
              imageUrl: asset.imageUrl || `https://images.unsplash.com/photo-${faker.number.int({ min: 1000000, max: 9999999 })}?w=800&q=80`,
              tenantId: auction.tenantId,
            },
          });

          // Vincular asset ao lote
          await prisma.assetsOnLots.create({
            data: {
              assetId: asset.id,
              lotId: lot.id,
              assignedBy: admin?.id || 'system',
            },
          });

          // Atualizar status do asset
          await prisma.asset.update({
            where: { id: asset.id },
            data: { status: 'LOTEADO' },
          });

          // Criar alguns lances para tornar mais realista
          const numBids = faker.number.int({ min: 3, max: 8 });
          const bidders = await prisma.user.findMany({ take: 5 });
          
          let currentBidPrice = discountedPrice;
          for (let b = 0; b < numBids && bidders.length > 0; b++) {
            const bidder = faker.helpers.arrayElement(bidders);
            currentBidPrice += faker.number.int({ min: 100, max: 1000 });

            try {
              await prisma.bid.create({
                data: {
                  lotId: lot.id,
                  auctionId: auction.id,
                  bidderId: bidder.id,
                  bidderDisplay: bidder.fullName || 'Arrematante',
                  amount: currentBidPrice,
                  tenantId: auction.tenantId,
                },
              });
            } catch (e) {}
          }

          lotsCreated++;
          console.log(`  ✅ Lote criado: ${lot.title} (encerra em ${timeframe.label})`);
        } catch (e) {
          console.log(`  ❌ Erro ao criar lote: ${e}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED DE LOTES ENCERRANDO EM BREVE CONCLUÍDO!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total de lotes criados: ${lotsCreated}`);
    console.log('\n🎯 Agora você pode ver os lotes com countdown na home page!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
