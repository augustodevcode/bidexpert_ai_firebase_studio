/**
 * Script para corrigir as 108 inconsistências finais
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo inconsistências finais...\n');

  let totalFixed = 0;

  try {
    // 1. CRIAR MAIS ASSETS (para vincular aos 34 lotes sem ativos)
    console.log('1️⃣  Criando mais Assets...');
    const sellers = await prisma.seller.findMany({ take: 10 });
    const categories = await prisma.lotCategory.findMany({ include: { subcategories: true } });
    const cities = await prisma.city.findMany({ include: { state: true } });
    
    let assetsCreated = 0;
    for (let i = 0; i < 100; i++) {
      const seller = faker.helpers.arrayElement(sellers);
      const category = faker.helpers.arrayElement(categories);
      const city = faker.helpers.arrayElement(cities);
      
      try {
        await prisma.asset.create({
          data: {
            title: `${faker.vehicle.vehicle()} - Asset ${i}`,
            description: faker.lorem.paragraph(),
            status: 'DISPONIVEL',
            categoryId: category.id,
            subcategoryId: category.subcategories[0]?.id,
            sellerId: seller.id,
            evaluationValue: faker.number.int({ min: 5000, max: 150000 }),
            locationCity: city.name,
            locationState: city.state.uf,
            address: faker.location.streetAddress(),
            tenantId: seller.tenantId,
          },
        });
        assetsCreated++;
      } catch (e) {}
    }
    console.log(`   ✅ ${assetsCreated} novos assets criados\n`);
    totalFixed += assetsCreated;

    // 2. VINCULAR ASSETS AOS 34 LOTES SEM ATIVOS
    console.log('2️⃣  Vinculando Assets aos Lotes sem Ativos...');
    const lotsWithoutAssets = await prisma.lot.findMany({
      where: { assets: { none: {} } },
    });
    
    const availableAssets = await prisma.asset.findMany({
      where: { status: 'DISPONIVEL' },
      take: 100,
    });

    let assetsLinked = 0;
    const admin = await prisma.user.findFirst({ 
      where: { roles: { some: { role: { name: 'ADMIN' } } } } 
    });

    for (const lot of lotsWithoutAssets) {
      if (availableAssets.length > 0) {
        const asset = availableAssets.pop()!;
        try {
          await prisma.assetsOnLots.create({
            data: {
              assetId: asset.id,
              lotId: lot.id,
              assignedBy: admin?.id || 'system',
            },
          });
          await prisma.asset.update({
            where: { id: asset.id },
            data: { status: 'LOTEADO' },
          });
          assetsLinked++;
        } catch (e) {}
      }
    }
    console.log(`   ✅ ${assetsLinked} assets vinculados\n`);
    totalFixed += assetsLinked;

    // 3. CORRIGIR STATUS DE LOTES (Lotes Abertos Incorretamente)
    console.log('3️⃣  Corrigindo Status de Lotes...');
    
    // Lotes ABERTO_PARA_LANCES em leilões ENCERRADOS/FINALIZADOS
    const lotsInClosedAuctions = await prisma.lot.updateMany({
      where: {
        status: 'ABERTO_PARA_LANCES',
        auction: {
          status: { in: ['ENCERRADO', 'FINALIZADO'] },
        },
      },
      data: { status: 'ENCERRADO' },
    });
    console.log(`   ✅ ${lotsInClosedAuctions.count} lotes em leilões encerrados corrigidos`);
    totalFixed += lotsInClosedAuctions.count;

    // Lotes ABERTO_PARA_LANCES em leilões CANCELADOS
    const lotsInCanceledAuctions = await prisma.lot.updateMany({
      where: {
        status: 'ABERTO_PARA_LANCES',
        auction: {
          status: 'CANCELADO',
        },
      },
      data: { status: 'CANCELADO' },
    });
    console.log(`   ✅ ${lotsInCanceledAuctions.count} lotes em leilões cancelados corrigidos`);
    totalFixed += lotsInCanceledAuctions.count;

    // Lotes ABERTO_PARA_LANCES em leilões SUSPENSOS
    const lotsInSuspendedAuctions = await prisma.lot.updateMany({
      where: {
        status: 'ABERTO_PARA_LANCES',
        auction: {
          status: 'SUSPENSO',
        },
      },
      data: { status: 'EM_BREVE' },
    });
    console.log(`   ✅ ${lotsInSuspendedAuctions.count} lotes em leilões suspensos corrigidos\n`);
    totalFixed += lotsInSuspendedAuctions.count;

    // 4. ADICIONAR LOCALIZAÇÃO AOS LOTES SEM LOCALIZAÇÃO (34 lotes)
    console.log('4️⃣  Adicionando Localização aos Lotes...');
    const lotsWithoutLocation = await prisma.lot.findMany({
      where: {
        OR: [
          { cityId: null },
          { cityName: null },
        ],
      },
    });

    let lotsLocationFixed = 0;
    for (const lot of lotsWithoutLocation) {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      try {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            cityId: randomCity.id,
            cityName: randomCity.name,
            stateId: randomCity.stateId,
            stateUf: randomCity.state.uf,
          },
        });
        lotsLocationFixed++;
      } catch (e) {}
    }
    console.log(`   ✅ ${lotsLocationFixed} lotes com localização adicionada\n`);
    totalFixed += lotsLocationFixed;

    // 5. ADICIONAR LOCALIZAÇÃO AOS LEILÕES SEM LOCALIZAÇÃO (1 leilão)
    console.log('5️⃣  Adicionando Localização aos Leilões...');
    const auctionsWithoutLocation = await prisma.auction.findMany({
      where: {
        OR: [
          { cityId: null },
          { address: null },
        ],
      },
    });

    let auctionsLocationFixed = 0;
    for (const auction of auctionsWithoutLocation) {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      try {
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            cityId: randomCity.id,
            stateId: randomCity.stateId,
            address: faker.location.streetAddress(),
            zipCode: faker.location.zipCode(),
          },
        });
        auctionsLocationFixed++;
      } catch (e) {}
    }
    console.log(`   ✅ ${auctionsLocationFixed} leilões com localização adicionada\n`);
    totalFixed += auctionsLocationFixed;

    // 6. ADICIONAR PERGUNTAS AOS LOTES ATIVOS/VENDIDOS (25 lotes)
    console.log('6️⃣  Adicionando Perguntas aos Lotes...');
    const lotsWithoutQuestions = await prisma.lot.findMany({
      where: {
        status: { in: ['ABERTO_PARA_LANCES', 'VENDIDO'] },
        questions: { none: {} },
      },
      take: 30,
    });

    const users = await prisma.user.findMany({ take: 10 });
    let questionsCreated = 0;

    for (const lot of lotsWithoutQuestions) {
      if (!lot.auctionId) continue;
      
      // Criar 1-3 perguntas por lote
      const numQuestions = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < numQuestions; i++) {
        const user = faker.helpers.arrayElement(users);
        try {
          await prisma.lotQuestion.create({
            data: {
              lotId: lot.id,
              auctionId: lot.auctionId,
              userId: user.id,
              userDisplayName: user.fullName || 'Usuário',
              questionText: faker.helpers.arrayElement([
                'Qual o estado de conservação?',
                'Aceita visita presencial?',
                'Tem nota fiscal?',
                'Qual o prazo de entrega?',
                'Aceita financiamento?',
              ]),
              answerText: faker.datatype.boolean() ? faker.helpers.arrayElement([
                'Sim, está em ótimo estado.',
                'Sim, pode agendar visita.',
                'Sim, possui nota fiscal.',
                'Entrega em até 15 dias.',
              ]) : null,
            },
          });
          questionsCreated++;
        } catch (e) {}
      }
    }
    console.log(`   ✅ ${questionsCreated} perguntas criadas\n`);
    totalFixed += questionsCreated;

    // 7. ADICIONAR AVALIAÇÕES AOS LOTES VENDIDOS (2 lotes)
    console.log('7️⃣  Adicionando Avaliações aos Lotes Vendidos...');
    const soldLotsWithoutReviews = await prisma.lot.findMany({
      where: {
        status: 'VENDIDO',
        reviews: { none: {} },
      },
      take: 10,
    });

    let reviewsCreated = 0;
    for (const lot of soldLotsWithoutReviews) {
      if (!lot.auctionId) continue;
      
      const user = faker.helpers.arrayElement(users);
      try {
        await prisma.review.create({
          data: {
            lotId: lot.id,
            auctionId: lot.auctionId,
            userId: user.id,
            userDisplayName: user.fullName || 'Usuário',
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.helpers.arrayElement([
              'Ótimo produto, recomendo!',
              'Excelente qualidade!',
              'Muito satisfeito com a compra.',
              'Produto conforme descrito.',
              'Entrega rápida e produto em perfeito estado.',
            ]),
          },
        });
        reviewsCreated++;
      } catch (e) {}
    }
    console.log(`   ✅ ${reviewsCreated} avaliações criadas\n`);
    totalFixed += reviewsCreated;

    // RESUMO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('✅ CORREÇÃO FINAL DE INCONSISTÊNCIAS CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total de correções aplicadas: ${totalFixed}`);
    console.log('\n🎯 Execute novamente a verificação de integridade na aplicação!');
    console.log('📉 As inconsistências devem ter reduzido de 108 para próximo de 0!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
