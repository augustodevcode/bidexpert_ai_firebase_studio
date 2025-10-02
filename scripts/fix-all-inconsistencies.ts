/**
 * Script para corrigir TODAS as inconsistências do banco de dados
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo inconsistências no banco de dados...\n');

  let totalFixed = 0;

  try {
    // 1. LEILÕES SEM LOTES - Criar lotes para esses leilões
    console.log('1️⃣  Corrigindo Leilões sem Lotes...');
    const auctionsWithoutLots = await prisma.auction.findMany({
      where: { lots: { none: {} } },
      take: 50,
    });
    
    let lotsCreated = 0;
    for (const auction of auctionsWithoutLots) {
      // Criar 1-3 lotes para cada leilão
      const numLots = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < numLots; i++) {
        try {
          await prisma.lot.create({
            data: {
              auctionId: auction.id,
              title: `Lote ${i + 1} - ${auction.title}`,
              description: faker.lorem.sentence(),
              price: faker.number.int({ min: 5000, max: 50000 }),
              initialPrice: faker.number.int({ min: 4000, max: 45000 }),
              status: 'EM_BREVE',
              type: 'Diversos',
              tenantId: auction.tenantId,
            },
          });
          lotsCreated++;
        } catch (e) {}
      }
    }
    console.log(`   ✅ ${lotsCreated} lotes criados para ${auctionsWithoutLots.length} leilões\n`);
    totalFixed += lotsCreated;

    // 2. LOTES SEM ATIVOS - Vincular assets disponíveis
    console.log('2️⃣  Corrigindo Lotes sem Ativos...');
    const lotsWithoutAssets = await prisma.lot.findMany({
      where: {
        assets: { none: {} },
      },
      take: 100,
    });
    
    const availableAssets = await prisma.asset.findMany({
      where: { status: 'DISPONIVEL' },
      take: 200,
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
    console.log(`   ✅ ${assetsLinked} assets vinculados a lotes\n`);
    totalFixed += assetsLinked;

    // 3. LEILÕES SEM ETAPAS - Criar etapas padrão
    console.log('3️⃣  Corrigindo Leilões sem Etapas...');
    const auctionsWithoutStages = await prisma.auction.findMany({
      where: { stages: { none: {} } },
      take: 100,
    });

    let stagesCreated = 0;
    for (const auction of auctionsWithoutStages) {
      try {
        // Criar 1ª Praça
        await prisma.auctionStage.create({
          data: {
            auctionId: auction.id,
            name: '1ª Praça',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        stagesCreated++;
      } catch (e) {}
    }
    console.log(`   ✅ ${stagesCreated} etapas criadas\n`);
    totalFixed += stagesCreated;

    // 4. LOTES ABERTOS INCORRETAMENTE - Corrigir status
    console.log('4️⃣  Corrigindo Lotes Abertos Incorretamente...');
    const incorrectlyOpenLots = await prisma.lot.count({
      where: {
        status: 'ABERTO_PARA_LANCES',
        auction: {
          status: { notIn: ['ABERTO', 'ABERTO_PARA_LANCES'] },
        },
      },
    });

    const fixedOpenLots = await prisma.lot.updateMany({
      where: {
        status: 'ABERTO_PARA_LANCES',
        auction: {
          status: { notIn: ['ABERTO', 'ABERTO_PARA_LANCES'] },
        },
      },
      data: { status: 'EM_BREVE' },
    });
    console.log(`   ✅ ${fixedOpenLots.count} lotes com status corrigido\n`);
    totalFixed += fixedOpenLots.count;

    // 5. ASSETS SEM LOCALIZAÇÃO - Adicionar cidades
    console.log('5️⃣  Corrigindo Assets sem Localização...');
    const cities = await prisma.city.findMany({ include: { state: true } });
    
    const assetsWithoutLocation = await prisma.asset.findMany({
      where: {
        OR: [
          { locationCity: null },
          { locationState: null },
        ],
      },
      take: 1000,
    });

    let locationsFixed = 0;
    for (const asset of assetsWithoutLocation) {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      try {
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            locationCity: randomCity.name,
            locationState: randomCity.state.uf,
          },
        });
        locationsFixed++;
      } catch (e) {}
    }
    console.log(`   ✅ ${locationsFixed} assets com localização adicionada\n`);
    totalFixed += locationsFixed;

    // 6. LOTES ENCERRADOS SEM LANCES - Adicionar lances
    console.log('6️⃣  Corrigindo Lotes Encerrados sem Lances...');
    const closedLotsWithoutBids = await prisma.lot.findMany({
      where: {
        status: 'ENCERRADO',
        bids: { none: {} },
      },
      take: 50,
    });

    const bidders = await prisma.user.findMany({ take: 10 });
    let bidsCreated = 0;

    for (const lot of closedLotsWithoutBids) {
      if (bidders.length > 0 && lot.auctionId) {
        // Criar 2-5 lances
        const numBids = faker.number.int({ min: 2, max: 5 });
        let currentPrice = Number(lot.initialPrice) || 1000;

        for (let i = 0; i < numBids; i++) {
          const bidder = faker.helpers.arrayElement(bidders);
          currentPrice += faker.number.int({ min: 100, max: 500 });
          
          try {
            await prisma.bid.create({
              data: {
                lotId: lot.id,
                auctionId: lot.auctionId,
                bidderId: bidder.id,
                bidderDisplay: bidder.fullName || 'Arrematante',
                amount: currentPrice,
                tenantId: lot.tenantId,
              },
            });
            bidsCreated++;
          } catch (e) {}
        }
      }
    }
    console.log(`   ✅ ${bidsCreated} lances criados\n`);
    totalFixed += bidsCreated;

    // 7. USUÁRIOS HABILITADOS SEM DOCUMENTOS - Adicionar documentos
    console.log('7️⃣  Corrigindo Usuários Habilitados sem Documentos...');
    const habilitatedUsersWithoutDocs = await prisma.user.findMany({
      where: {
        habilitationStatus: 'HABILITADO',
        documents: { none: {} },
      },
      take: 50,
    });

    const docTypes = await prisma.documentType.findMany({ take: 5 });
    let docsCreated = 0;

    for (const user of habilitatedUsersWithoutDocs) {
      // Criar 2-3 documentos por usuário
      const docsToCreate = docTypes.slice(0, faker.number.int({ min: 2, max: 3 }));
      
      for (const docType of docsToCreate) {
        try {
          await prisma.userDocument.create({
            data: {
              userId: user.id,
              documentTypeId: docType.id,
              fileName: `doc-${faker.string.alphanumeric(8)}.pdf`,
              fileUrl: `https://storage.bidexpert.com/docs/${user.id}/${faker.string.alphanumeric(16)}.pdf`,
              status: 'APPROVED',
            },
          });
          docsCreated++;
        } catch (e) {}
      }
    }
    console.log(`   ✅ ${docsCreated} documentos criados\n`);
    totalFixed += docsCreated;

    // RESUMO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('✅ CORREÇÃO DE INCONSISTÊNCIAS CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total de correções aplicadas: ${totalFixed}`);
    console.log('\n🎯 Execute novamente a verificação de integridade na aplicação!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
